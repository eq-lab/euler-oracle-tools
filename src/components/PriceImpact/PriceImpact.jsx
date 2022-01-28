import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

import { CSVLink } from "react-csv";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, } from 'recharts';
import { DefaultTooltipContent } from 'recharts/lib/component/DefaultTooltipContent';
import { sortBy } from "lodash";
import { matchSorter } from "match-sorter";
import { Decimal } from 'decimal.js';
import { utils } from 'ethers';



import {
  getSlot0,
  getPumpAndDump,
  numberFormatText,
  binarySearchTradeValues,
  formatPrice,
  getPoolFees,
  MAX_TICK_PRICE,
  MIN_TICK_PRICE,
  WETH_ADDRESS,
  computeUniV3PoolAddress,
  priceToSqrtX96Price,
  sqrtPriceX96ToPrice,
  isInverted,
} from "../../utils";


export const PriceImpact = () => {
  const [tokenList, setTokenList] = useState([]);
  const [symbol, setSymbol] = useState('USDC');

  const [fee, setFee] = useState(3000);
  const [ethPrice, setEthPrice] = useState(0);
  const [trades, setTrades] = useState();
  const [currPrice, setCurrPrice] = useState();
  const [currSqrtPriceX96, setCurrSqrtPriceX96] = useState();
  const [currTick, setCurrTick] = useState();
  const [cardinality, setCardinality] = useState();
  const [poolFees, setPoolFees] = useState([]);

  const [targetPriceImpact, setTargetPriceImpact] = useState(90);
  const [targetPriceImpactLoading, setTargetPriceImpactLoading] = useState(false);
  const [targetPriceImpactValue, setTargetPriceImpactValue] = useState();
  
  const [targetEthPrice, setTargetEthPrice] = useState('');
  const [targetUsdPrice, setTargetUsdPrice] = useState('');
  const [targetPriceLoading, setTargetPriceLoading] = useState(false);
  const [targetPriceValue, setTargetPriceValue] = useState();
  
  const [window, setWindow] = useState(144);
  const [attackBlocks, setAttackBlocks] = useState(1);
  const [targetEthTwap, setTargetEthTwap] = useState('');
  const [targetUsdTwap, setTargetUsdTwap] = useState('');
  const [targetTwapLoading, setTargetTwapLoading] = useState(false);
  const [targetTwapValue, setTargetTwapValue] = useState();
  const [targetTwapSpot, setTargetTwapSpot] = useState('');
  const [targetTwapRatio, setTargetTwapRatio] = useState('');

  const [error, setError] = useState();
  const [errorOpen, setErrorOpen] = useState(false);
// todo here
  const cancelPriceImpactSearch = useRef(() => {});
  const cancelPriceSearch = useRef(() => {});
  const cancelTwapSearch = useRef(() => {});
  const csvLink = useRef();

  const token = tokenList.length > 0 && tokenList.find(t => t.symbol === symbol)

  const amountsUSD = [
    100_000,
    200_000,
    300_000,
    400_000,
    500_000,
    600_000,
    700_000,
    800_000,
    900_000,
    1_000_000,
    2_000_000,
    3_000_000,
    4_000_000,
    5_000_000,
    6_000_000,
    7_000_000,
    8_000_000,
    9_000_000,
    10_000_000,
  ];

  let minTargetTwapSpotPercentage = '-';
  let maxTargetTwapSpotPercentage = '-';
  let maxTargetTwapSpot
  let minTargetTwapSpot
  let twapTargetExceedsMax = false;

  if (currPrice && ethPrice && currTick) {
    const p = utils.formatEther(currPrice);

    // const tickPrice = Decimal.pow(1.0001, currTick)
    // const maxTick = MAX_TICK_PRICE.pow(attackBlocks).mul(Decimal.pow(tickPrice, window - attackBlocks)).pow(Decimal.div(1, window))
    // const minTick = MIN_TICK_PRICE.pow(attackBlocks).mul(Decimal.pow(tickPrice, window - attackBlocks)).pow(Decimal.div(1, window))
    // console.log('tickPrice: ', tickPrice.toFixed());
    // console.log('tickPrice Formatted: ', tickDecimal(tickPrice).toFixed(10));
    // console.log('maxTick Formatted: ', tickDecimal(maxTick).toFixed(10));
    
    maxTargetTwapSpot = MAX_TICK_PRICE.pow(attackBlocks).mul(Decimal.pow(p, window - attackBlocks)).pow(Decimal.div(1, window));
    // console.log('maxTargetTwapSpot: ', maxTargetTwapSpot.toFixed(10));
    // console.log('maxTick: ', maxTick.toFixed(10));
    minTargetTwapSpot = MIN_TICK_PRICE.pow(attackBlocks).mul(Decimal.pow(p, window - attackBlocks)).pow(Decimal.div(1, window));
    // console.log('minTargetTwapSpot: ', minTargetTwapSpot.toFixed(100));
    // console.log('minTick: ', minTick.toFixed(100));

    
    // minTargetTwapSpotPercentage = Decimal.sub(minTick, tickPrice).div(tickPrice).mul(100).toFixed(2);
    // maxTargetTwapSpotPercentage = Decimal.sub(maxTick, tickPrice).div(tickPrice).mul(100).toFixed(2);
    minTargetTwapSpotPercentage = Decimal.sub(minTargetTwapSpot, p).div(p).mul(100).round().toFixed(0);
    maxTargetTwapSpotPercentage = Decimal.sub(maxTargetTwapSpot, p).div(p).mul(100).round().toFixed(0);
    
    maxTargetTwapSpot = maxTargetTwapSpot.div(Decimal.pow(10, 18 - token.decimals));
    minTargetTwapSpot = minTargetTwapSpot.div(Decimal.pow(10, 18 - token.decimals));

    if (targetEthTwap) {
      const t = new Decimal(targetEthTwap);
      twapTargetExceedsMax = t.lt(minTargetTwapSpot) || t.gt(maxTargetTwapSpot);
    }
  }
  
  const getStandardTradesTable = () => {
    return amountsUSD.map(a => {
      const pump = trades.pump.find(t => t.value === a);
      const dump = trades.dump.find(t => t.value === a);
      return { pump, dump };
    })
  };

  const getStandardTrades = () => {
    return getStandardTradesTable().reduce((accu, t) => {
      accu.pump.push(t.pump);
      accu.dump.push(t.dump);
      return accu
    }, { pump: [], dump: []})
  }
  
  const getCostOfAttack = trade => {
    return trade.tokenOut === WETH_ADDRESS
      ? trade.value - utils.formatEther(trade.amountOut) * ethPrice
      : trade.value - utils.formatUnits(trade.amountOut, token.decimals) * formatPrice(currPrice, token) * ethPrice;
  };

  useEffect(() => {
    Promise.all([
      axios.get('https://raw.githubusercontent.com/euler-xyz/euler-tokenlist/master/euler-tokenlist.json'),
      axios.get(`https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD`),
    ])
    .then(([result1, result2]) => {
      setTokenList(sortBy(result1.data.tokens, 'symbol'));
      setEthPrice(Number(result2.data.USD));
    });
  }, []);


  useEffect(() => {
    if (!tokenList.length || !ethPrice) return;

    getPoolFees(token.address).then(fees => {
      setPoolFees(fees);
      setFee(fees.includes(3000) ? 3000 : fees[0]);
    });
  }, [symbol, tokenList, ethPrice]);

  useEffect(() => {
    if (!tokenList.length || !ethPrice || !poolFees.includes(fee)) return;

    getSlot0(token, fee).then(({ price, sqrtPriceX96, tick, observationCardinality }) => {
      setCurrPrice(price);
      setCurrSqrtPriceX96(sqrtPriceX96.toString());
      setCurrTick(tick);
      setCardinality(observationCardinality);
      setTargetEthPrice(formatPrice(price, token));
      setTargetUsdPrice(formatPrice(price, token) * ethPrice);
      setTargetEthTwap(formatPrice(price, token));
      setTargetUsdTwap(formatPrice(price, token) * ethPrice);
    });
  }, [symbol, fee, poolFees, tokenList, ethPrice]);

  useEffect(() => {
    if (!tokenList.length || !ethPrice || !currPrice || !poolFees.includes(fee)) return;

    setTrades(null);
    Promise.all(amountsUSD.map(a => getPumpAndDump(currPrice, token, fee, ethPrice, a)))
      .then(res => {
        setTrades({
          pump: res.map(r => r.pump),
          dump: res.map(r => r.dump),
        });
      })
      .catch(() => {
        handleError('Failed to fetch quotes')
      });

  }, [symbol, fee, poolFees, tokenList, ethPrice, currPrice && currPrice.toString()]);

  const onTargetPriceImpact = () => {
    cancelPriceImpactSearch.current();

    setTargetPriceImpactLoading(true);

    const targetDecimal = new Decimal(targetPriceImpact);
    const { promise, cancel } = binarySearchTradeValues(currPrice, currSqrtPriceX96, token, fee, ethPrice, targetDecimal, 'priceImpact');
    cancelPriceImpactSearch.current = cancel;

    promise
      .then(([pump, dump]) => {
        resetResults();
        setTargetPriceImpactValue({pump: pump.best, dump: dump.best});

        const standardTrades = getStandardTrades();
        setTrades({
          pump: sortBy(standardTrades.pump.concat(pump.trades), 'value'), 
          dump: sortBy(standardTrades.dump.concat(dump.trades), 'value'), 
        })
        setTargetPriceImpactLoading(false);
      })
      .catch(e => {
        handleError(e)
      });
    return () => cancelPriceImpactSearch.current();
  };

  const onTargetPrice = () => {
    cancelPriceSearch.current();

    setTargetPriceLoading(true);
    const targetDecimal = new Decimal(targetEthPrice);
    const { promise, cancel } = binarySearchTradeValues(currPrice, currSqrtPriceX96, token, fee, ethPrice, targetDecimal, 'price');
    cancelPriceSearch.current = cancel;

    promise
      .then(([pump, dump]) => {
        resetResults();
        setTargetPriceValue({pump: pump && pump.best, dump: dump && dump.best});

        const standardTrades = getStandardTrades();
        setTrades({
          pump: sortBy(standardTrades.pump.concat(pump ? pump.trades : []), 'value'), 
          dump: sortBy(standardTrades.dump.concat(dump ? dump.trades : []), 'value'), 
        })
        setTargetPriceLoading(false);
      })
      .catch(e => {
        setTargetPriceLoading(false);
        handleError(e)
      })

    return () => cancelPriceSearch.current();
  };

  const onTargetTwap = () => {
    cancelTwapSearch.current();
    
    const inverted = isInverted(token.address); 
    // TODO helper
    let currPriceDecimal = new Decimal(utils.formatEther(currPrice.toString()));

    let target = targetEthTwap;
    target = Decimal.mul(target, Decimal.pow(10, 18 - token.decimals));

    if (inverted) {
      target = Decimal.div(1, target);
      currPriceDecimal = Decimal.div(1, currPriceDecimal);
    }

    target = target.pow(window).div(currPriceDecimal.pow(window - attackBlocks)).pow(Decimal.div(1, attackBlocks));

    target = priceToSqrtX96Price(target).add(2);
    setTargetTwapRatio(target);
    setTargetTwapSpot(formatPrice(sqrtPriceX96ToPrice(target.toFixed(), inverted), token));
    console.log('target sqrtPrice: ', target.toFixed());
    console.log('target price ETH:', formatPrice(sqrtPriceX96ToPrice(target.toFixed(), inverted), token));
    console.log('target price USD:', formatPrice(sqrtPriceX96ToPrice(target.toFixed(), inverted), token) * ethPrice);

    const { promise, cancel } = binarySearchTradeValues(currPrice, currSqrtPriceX96, token, fee, ethPrice, target, 'sqrtPriceX96After');
    cancelPriceSearch.current = cancel;
    setTargetTwapLoading(true);
    promise
      .then(([pump, dump]) => {
        resetResults();
        if (inverted) [pump, dump] = [dump, pump];
        setTargetTwapValue({pump: pump && pump.best, dump: dump && dump.best});

        const standardTrades = getStandardTrades();
        setTrades({
          pump: sortBy(standardTrades.pump.concat(pump ? pump.trades : []), 'value'), 
          dump: sortBy(standardTrades.dump.concat(dump ? dump.trades : []), 'value'), 
        })
      })
      .catch(e => {
        console.log('e: ', e);
        handleError(e);
      })
      .finally(() => {
        setTargetTwapLoading(false);
      })

    return () => cancelTwapSearch.current();
  };

  const onMaxTwapTarget = (direction) => () => {
    if (direction === 'pump') {
      setTargetEthTwap(maxTargetTwapSpot);
      setTargetUsdTwap(maxTargetTwapSpot * ethPrice);
    } else {
      setTargetEthTwap(minTargetTwapSpot);
      setTargetUsdTwap(minTargetTwapSpot * ethPrice);
    }
  }

  const resetResults = () => {
    setTargetPriceImpactValue(null);
    setTargetPriceValue(null);
    setTargetTwapValue(null);
  };

  const resetMarket = () => {
    setCurrPrice(null);
    setTrades(null);
    setTargetPriceImpactValue(null);
    setTargetPriceValue(null);
    setTargetTwapValue(null);
    setFee(3000);
    setPoolFees([]);
  };

  const handleToken = (option) => {
    if (!option) return;
    resetMarket();
    setSymbol(option.symbol);
  };

  const handleFee = (event) => {
    resetMarket();
    setFee(event.target.value);
  };

  const handleEthPrice = (event) => {
    setEthPrice(event.target.value);
  };

  const handleTargetPrice = (currency) => (event) => {
    if (currency === 'eth') {
      setTargetEthPrice(event.target.value);
      setTargetUsdPrice(event.target.value * ethPrice);
    } else {
      setTargetUsdPrice(event.target.value);
      setTargetEthPrice(event.target.value / ethPrice);
    }
  };

  const handleTargetTWAP = (currency) => (event) => {
    if (currency === 'eth') {
      setTargetEthTwap(event.target.value);
      setTargetUsdTwap(event.target.value * ethPrice);
    } else {
      setTargetUsdTwap(event.target.value);
      setTargetEthTwap(event.target.value / ethPrice);
    }
  };

  const handleWindow = (event) => {
    setWindow(event.target.value);
  };

  const handleAttackBlocks = (event) => {
    setAttackBlocks(event.target.value);
  };

  const handleDownload = () => {
    csvLink.current.link.click();
  }

  const handleTargetPriceImpact = (event) => {
    setTargetPriceImpact(event.target.value);
  }

  const handleErrorClose = () => {
    setErrorOpen(false)
  }

  const handleError = (e) => {
    if (e.message !== 'cancelled') {
      setError(e.message || e)
      setErrorOpen(true)
    };
  } 
// todo here
  const stringToFixed = (val, precision) => {
    const i = val.indexOf('.')
    return Number(i === -1 ? val : val.slice(0, i + precision + 1))
  }
  let pumpChartData = (trades && trades.pump.map(s => ({...s, priceImpact: stringToFixed(s.priceImpact, 3) }))) || [];
  let dumpChartData = (trades && trades.dump.map(s => ({...s, priceImpact: stringToFixed(s.priceImpact, 3) }))) || [];

  const tokenSelectOptions = tokenList.map((t, i) => ({
    ...t,
    label: tokenList.filter(a => a.symbol === t.symbol).length > 1 ? `${t.symbol} ${t.name}` : t.symbol,
  }));
  const tokenSelectValue = tokenSelectOptions.find(o => o.symbol === symbol) || {label: ""};

  const CustomTooltip = props => {
    if (props.payload[0] != null) {
      const payload = props.payload[0].payload;
      const amountIn = utils.formatUnits(
        payload.amountIn,
        payload.tokenOut === WETH_ADDRESS ? token.decimals : 18,
      );
      const amountOut = utils.formatUnits(
        payload.amountOut,
        payload.tokenOut === WETH_ADDRESS ? 18 : token.decimals,
      );
      const newPayload = [
        ...props.payload,
        {
          name: 'price ETH',
          value: payload.price,
        },
        {
          name: 'price USD',
          value: payload.price * ethPrice,
        },
        {
          name: 'amount in',
          value: `${amountIn} ${payload.tokenOut === WETH_ADDRESS ? token.symbol : 'WETH'}`,
        },
        {
          name: 'amount out',
          value: `${amountOut} ${payload.tokenOut === WETH_ADDRESS ? 'WETH' : token.symbol}`,
        },
        {
          name: 'cost',
          value: getCostOfAttack(payload).toLocaleString() + ' USD',
        },
      ];
  
      return <DefaultTooltipContent {...props} payload={newPayload} />;
    }
  
    // we just render the default
    return <DefaultTooltipContent {...props} />;
  };

  const SearchResult = ({ result }) => {
    return (
      <Grid container sx={{ maxWidth: 500 }}>
        <Grid item xs={4}>
          Value:
        </Grid>
        <Grid item xs={8} mb={1} >
          ${result.value.toLocaleString()}
        </Grid>
        {result.targetSpot && (
          <>
            <Grid item xs={4}>
              Target Spot ETH:
            </Grid>
            <Grid item xs={8}>
              {result.targetSpot}
            </Grid>
            <Grid item xs={4}>
              Target Spot USD:
            </Grid>
            <Grid item xs={8} mb={1}>
              {(result.targetSpot * ethPrice).toLocaleString()}
            </Grid>
          </>
        )}
        <Grid item xs={4}>
          Price Impact:
        </Grid>
        <Grid item xs={8}>
          {Number(result.priceImpact).toLocaleString()} %
        </Grid>
        <Grid item xs={4}>
          Price ETH:
        </Grid>
        <Grid item xs={8}>
          {result.price}
        </Grid>
        <Grid item xs={4}>
          Price USD:
        </Grid>
        <Grid item xs={8} mb={1}>
          {(result.price * ethPrice).toLocaleString()}
        </Grid>
        <Grid item xs={4}>
          Cost USD:
        </Grid>
        <Grid item xs={8}>
          ${getCostOfAttack(result).toLocaleString()}
        </Grid>
      </Grid>
    )
  }
  const filterOptions = (options, { inputValue }) => {
    return matchSorter(options, inputValue, { keys: ["name", "symbol", "address"] })
  }

  return (
    <Box display="flex" sx={{height: '100vh'}}>
      <Box display="flex" flexDirection="column">
        <Box sx={{ width: 200, margin: 1, }}>
          <FormControl fullWidth> 
              <Autocomplete
                disablePortal
                id="combo-box-demo"
                options={tokenSelectOptions}
                filterOptions={filterOptions}
                renderInput={(params) => <TextField {...params} label="Token" />}
                value={tokenSelectValue}
                isOptionEqualToValue={(a, b) => a.symbol === b.symbol}
                onChange={(event, option) => handleToken(option)}
              />
            </FormControl>
          </Box>
          <Box sx={{ width: 200, margin: 1, }}>
            <FormControl fullWidth> 
              <InputLabel id="demo-simple-select-label2">Fee</InputLabel>
              <Select
                labelId="demo-simple-select-label-fee"
                id="demo-simple-select-fee"
                value={fee}
                label="Fee"
                onChange={handleFee}
              >
                <MenuItem value={100} key={100} disabled={!poolFees.includes(100)}>0.01%</MenuItem>
                <MenuItem value={500} key={500} disabled={!poolFees.includes(500)}>0.05%</MenuItem>
                <MenuItem value={3000} key={3000} disabled={!poolFees.includes(3000)}>0.3%</MenuItem>
                <MenuItem value={10000} key={10000} disabled={!poolFees.includes(10000)}>1%</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 120, width: 200, margin: 1, }}>
            <FormControl fullWidth> 
            <TextField
              id="eth-price"
              label="ETH Price"
              variant="outlined"
              value={ethPrice}
              onChange={handleEthPrice}
              InputProps={{
                endAdornment: <>USD</>,
              }}
            />
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 120, width: 200, margin: 1, }}>
            <FormControl fullWidth>
            <TextField
              id="target-priceImpact"
              label="Target Price Impact"
              variant="outlined"
              value={targetPriceImpact}
              onChange={handleTargetPriceImpact}
              InputProps={{
                endAdornment: (
                  <>
                  %
                  <IconButton
                    disabled={!tokenList.length || !ethPrice || isNaN(targetPriceImpact) || !currPrice || targetPriceImpactLoading}
                    color="primary"
                    onClick={onTargetPriceImpact}
                    sx={{marginLeft: 1}}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </>
                )
              }}
            />
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 120, width: 200, margin: 1, }}>
            <FormControl fullWidth>
            <TextField
              id="target-price-eth"
              label="Target Spot ETH"
              variant="outlined"
              value={targetEthPrice}
              onChange={handleTargetPrice('eth')}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    disabled={!tokenList.length || !ethPrice || isNaN(targetPriceImpact) || !currPrice || targetPriceLoading}
                    color="primary"
                    onClick={onTargetPrice}
                    sx={{marginLeft: 1}}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                )
              }}
            />
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 120, width: 200, margin: 1, }}>
            <FormControl fullWidth>
            <TextField
              id="target-twap-usd"
              label="Target Spot USD"
              variant="outlined"
              value={targetUsdPrice}
              onChange={handleTargetPrice('usd')}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    disabled={!tokenList.length || !ethPrice || isNaN(targetPriceImpact) || !currPrice || targetPriceLoading}
                    color="primary"
                    onClick={onTargetPrice}
                    sx={{marginLeft: 1}}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                )
              }}
            />
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 120, width: 200, margin: 1, }}>
            <FormControl fullWidth>
            <TextField
              id="target-twap-window"
              label="TWAP window"
              variant="outlined"
              value={window}
              onChange={handleWindow}
              InputLabelProps={{ shrink: true }}
            />
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 120, width: 200, margin: 1, }}>
            <FormControl fullWidth>
            <TextField
              id="target-twap-blocks"
              label="Attack Blocks"
              variant="outlined"
              value={attackBlocks}
              onChange={handleAttackBlocks}
              InputLabelProps={{ shrink: true }}
            />
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 120, width: 200, margin: 1, }}>
            <FormControl fullWidth>
            <TextField
              id="target-twap-eth"
              label="Target TWAP ETH"
              variant="outlined"
              value={targetEthTwap}
              onChange={handleTargetTWAP('eth')}
              error={twapTargetExceedsMax}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    disabled={!tokenList.length || !ethPrice ||  !currPrice || targetTwapLoading || twapTargetExceedsMax}
                    color="primary"
                    onClick={onTargetTwap}
                    sx={{marginLeft: 1}}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                )
              }}
            />
            </FormControl>
          </Box>
          {/* <Box ml={1} mb={1} sx={{ minWidth: 120, width: 200,  fontSize: 12}}>
            MIN: {minTargetTwapSpot} ({minTargetTwapSpotPercentage}%)
            <br/>
            MAX: {maxTargetTwapSpot} ({maxTargetTwapSpotPercentage}%)
          </Box> */}
          <Box sx={{ minWidth: 120, width: 200, margin: 1, }}>
            <FormControl fullWidth>
            <TextField
              id="target-price-usd"
              label="Target TWAP USD"
              variant="outlined"
              value={targetUsdTwap}
              error={twapTargetExceedsMax}
              onChange={handleTargetTWAP('usd')}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    disabled={!tokenList.length || !ethPrice ||  !currPrice || targetTwapLoading || twapTargetExceedsMax}
                    color="primary"
                    onClick={onTargetTwap}
                    sx={{marginLeft: 1}}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                )
              }}
            />
            </FormControl>
          </Box>
          {/* <Box ml={1} mb={1} sx={{ minWidth: 120, width: 200,  fontSize: 12}}>
            MIN: {minTargetTwapSpot * ethPrice} ({minTargetTwapSpotPercentage}%)
            <br/>
            MAX: {maxTargetTwapSpot * ethPrice} ({maxTargetTwapSpotPercentage}%)
          </Box> */}
        <Button
          sx={{ minWidth: 120, width: 200, margin: 1, }}
          disabled={!trades}
          variant="contained"
          endIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download csv
        </Button>
        {trades && trades.pump.length > 0 && (
          <CSVLink
            headers={['VALUE', 'PUMP PRICE IMPACT', 'PUMP PRICE', 'DUMP PRICE IMPACT', 'DUMP PRICE']}
            data={getStandardTradesTable().map(({ pump, dump }) => pump && dump &&[pump.value, pump.priceImpact, pump.price, dump.priceImpact, dump.price])}
            target="_blank"
            filename={`${symbol}_${fee}.csv`}
            ref={csvLink}
          />
        )}
      </Box>
      {trades
        ? (
          <>
            <Box display="flex" flexDirection="column" mt={1}>
              <Box sx={{width: '100%'}} mb={1}>
                <Card>
                  <CardContent>
                    <Box display="flex">
                      <Link target="_blank" href={`https://etherscan.io/token/${token.address}`}>
                        Token
                      </Link>
                      <Link ml={1} target="_blank" href={`https://info.uniswap.org/#/pools/${computeUniV3PoolAddress(token.address, WETH_ADDRESS, fee).toLowerCase()}`}>
                        Pool
                      </Link>
                      <Box display="flex" ml={1}>
                        Tick: {currTick}
                      </Box>
                      <Box display="flex" ml={1}>
                        Cardinality: {cardinality}
                      </Box>
                    </Box>
                    <Box display="flex" mb={1}>
                      <Box display="flex" >
                        Price USD: {formatPrice(currPrice, token) * ethPrice}
                      </Box>
                      <Box display="flex" ml={1}>
                        Price ETH: {formatPrice(currPrice, token)}
                      </Box>
                    </Box>
                    <Box display="flex" flexDirection="column">
                      <Box display="flex" mb={1}>
                        Max TWAP targets USD (given window, attack blocks and tick pricing limits)
                      </Box>
                      <Box display="flex" flexDirection="column">
                        <Box sx={{cursor: 'pointer'}} onClick={onMaxTwapTarget('pump')}>Pump: {maxTargetTwapSpot * ethPrice} ({maxTargetTwapSpotPercentage}%)</Box>
                        <Box sx={{cursor: 'pointer'}} onClick={onMaxTwapTarget('dump')}>Dump: {minTargetTwapSpot * ethPrice} ({minTargetTwapSpotPercentage}%)</Box>
                      </Box>
                    </Box>
                    {/* <Box display="flex" >
                      Price USD: {formatPrice(currPrice, token) * ethPrice}
                      <br/>
                      Price ETH: {formatPrice(currPrice, token)}
                    </Box> */}
                  </CardContent>
                </Card>
              </Box>
              {targetPriceImpactValue && (
                <Box mb={1} sx={{width: '100%'}}>
                  <Card mt={1}>
                    <CardContent>
                      <Box mb={1}>
                        <b>Target Price Impact</b>
                      </Box>
                      <SearchResult result={targetPriceImpactValue.pump} />
                      <Divider sx={{marginTop: 1, marginBottom: 1}}/>
                      <SearchResult result={targetPriceImpactValue.dump} />
                    </CardContent>
                  </Card>
                </Box>
              )}
              {targetPriceValue && (
                <Box mb={1} sx={{width: '100%'}}>
                  <Card mt={1}>
                    <CardContent>
                      <Box mb={1}>
                        <b>Target Spot</b>
                      </Box>
                      <SearchResult result={targetPriceValue.pump || targetPriceValue.dump} />
                    </CardContent>
                  </Card>
                </Box>
              )}
              {targetTwapValue && (
                <Box mb={1} sx={{width: '100%'}}>
                  <Card mt={1}>
                    <CardContent>
                      <Box mb={1}>
                        <b>Target TWAP</b>
                      </Box>
                      <SearchResult result={{
                        ...(targetTwapValue.pump || targetTwapValue.dump),
                        targetSpot: targetTwapSpot
                      }} />
                    </CardContent>
                  </Card>
                </Box>
              )}
              <Box display="flex" mt={1}>
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 400 }} size="small" aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell>USD VALUE</TableCell>
                        <TableCell align="right">PUMP PERCENTAGE</TableCell>
                        <TableCell align="right">DUMP PERCENTAGE</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getStandardTradesTable().map((row) => row.pump && (
                        <TableRow
                          key={row.pump.value}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row" key={Math.random()}>
                            {numberFormatText(row.pump.value)}
                          </TableCell>
                          <TableCell align="right" key={Math.random()}>{row.pump.priceImpact}%</TableCell>
                          <TableCell align="right" key={Math.random()}>{row.dump.priceImpact}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              {/* todo here */}
              {trades && trades.pump.length ===0 && (
                <Box display="flex" mt={1} mb={1} sx={{color: "red"}} flex>
                  NO LIQUIDITY
                </Box>
              )}
            </Box>
            {trades && trades.pump.length > 0 && (
              <Box display="flex" flexDirection="column" ml={1} mt={1}>
                <LineChart
                  width={900}
                  height={450}
                  data={pumpChartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 40,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value" domain={['dataMin', 'dataMax']} type="number" tickFormatter={(tick) => {
                    return numberFormatText(tick)
                  }}/>
                  <YAxis type="number" />
                  <Tooltip 
                    content={CustomTooltip} 
                    labelFormatter={v => v.toLocaleString() + ' USD'} 
                    formatter={(value, name) => [name === 'price impact' ? `${value}%` : value, name]}
                  />
                  <Legend />
                  {targetPriceImpactValue && <ReferenceLine x={targetPriceImpactValue.pump.value} stroke="red" label="Target Impact" />}
                  {targetPriceValue && targetPriceValue.pump && <ReferenceLine x={targetPriceValue.pump.value} stroke="violet" label="Target Spot" />}
                  {targetTwapValue && targetTwapValue.pump && <ReferenceLine x={targetTwapValue.pump.value} stroke="green" label="Target TWAP" />}
                  <Line name="price impact" type="monotone" dataKey="priceImpact" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
                <LineChart
                  width={900}
                  height={450}
                  data={dumpChartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 40,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value" domain={['dataMin', 'dataMax']} type="number" tickFormatter={(tick) => {
                    return numberFormatText(tick)
                  }}/>
                  <YAxis type="number" />
                  <Tooltip
                    content={CustomTooltip}
                    labelFormatter={v => v.toLocaleString() + ' USD'}
                    formatter={(value, name) => [name === 'price impact' ? `${value}%` : value, name]}
                  />
                  <Legend />
                  {targetPriceImpactValue && <ReferenceLine x={targetPriceImpactValue.dump.value} stroke="red" label="Target Impact" />}
                  {targetPriceValue && targetPriceValue.dump && <ReferenceLine x={targetPriceValue.dump.value} stroke="violet" label="Target Spot" />}
                  {targetTwapValue && targetTwapValue.dump && <ReferenceLine x={targetTwapValue.dump.value} stroke="green" label="Target TWAP" />}
                  <Line name="price impact" type="monotone" dataKey="priceImpact" stroke="#82ca9d" activeDot={{ r: 8 }} />
                </LineChart>
              </Box>
            )}
          </>
          
        )
        : (
          <Box sx={{width: '100%', height: '100%'}} display="flex" justifyContent="center" alignItems="center">
            <CircularProgress />
          </Box>
        )}
      <Dialog
        open={errorOpen}
        onClose={handleErrorClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          ERROR
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {error}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleErrorClose}>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
