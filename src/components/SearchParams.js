import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { fetchBonds } from '../store/Bonds.slice';

import { setParam, resetParams } from '../store/SearchParams.slice';

export const SearchParams = () => {
  const searchParams = useSelector(({ searchParams }) => searchParams);
  const {
    minPrice,
    maxPrice,
    minDuration,
    maxDuration,
    minYield,
    maxYield,
    minVolumePerDay,
    minVolumePerPeriod,
    OfferYesNo,
  } = searchParams;

  const dispatch = useDispatch();

  /*
    minPrice: number,           // Цена больше этой цифры
    maxPrice: number,           // Цена меньше этой цифры

    minYield: number,           // Доходность больше этой цифры
    maxYield: number,           // Доходность меньше этой цифры

    minDuration: number,        // Дюрация больше этой цифры
    maxDuration: number,        // Дюрация меньше этой цифры

    minVolumePerDay: number,    // Объем сделок в каждый из n дней, шт. больше этой цифры
    minVolumePerPeriod: number, // Совокупный объем сделок за n дней, шт. больше этой цифры

    OfferYesNo: boolean,        // Учитывать, чтобы денежные выплаты были известны до самого погашения?
   */

  const handleParam = useCallback((param) => (e) => { dispatch(setParam([param, e.target.value])) }, [dispatch]);

  const handleGetData = useCallback(() => { dispatch(fetchBonds()) }, [dispatch]);

  const handleReset = useCallback(() => { dispatch(resetParams()) }, [dispatch]);

  return (
    <div>
      <div>
        Цена (%) от
        <input type="number" value={minPrice} onChange={handleParam('minPrice')} />
        до
        <input type="number" value={maxPrice} onChange={handleParam('maxPrice')} />
      </div>
      <div>
        Срок погашения (мес) от
        <input type="number" value={minDuration} onChange={handleParam('minDuration')} />
        до
        <input type="number" value={maxDuration} onChange={handleParam('maxDuration')} />
      </div>
      <div>
        Доходность (% г) от
        <input type="number" value={minYield} onChange={handleParam('minYield')} />
        до
        <input type="number" value={maxYield} onChange={handleParam('maxYield')} />
      </div>
      <div>
        Минимальный объем торгов за день
        <input type="number" value={minVolumePerDay} onChange={handleParam('minVolumePerDay')} />
      </div>
      <div>
        Совокупный объем за N дней
        <input type="number" value={minVolumePerPeriod} onChange={handleParam('minVolumePerPeriod')} />
      </div>
      <div>
        Offer Yes/No
        <input type="boolean" value={OfferYesNo} onChange={handleParam('OfferYesNo')} />
      </div>
      <button onClick={handleReset}>Reset</button>
      <button onClick={handleGetData}>Get MOEX data</button>
    </div>
  );
};
