import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface ISearchParamsState {
  minYield: number,       // Доходность больше этой цифры
  maxYield: number,       // Доходность меньше этой цифры
  minPrice: number,       // Цена больше этой цифры
  maxPrice: number,       // Цена меньше этой цифры
  minDuration: number,    // Дюрация больше этой цифры
  maxDuration: number,    // Дюрация меньше этой цифры
  minVolumePerDay: number,      // Объем сделок в каждый из n дней, шт. больше этой цифры
  minVolumePerPeriod: number,  // Совокупный объем сделок за n дней, шт. больше этой цифры
  OfferYesNo: boolean,    // Учитывать, чтобы денежные выплаты были известны до самого погашения?
}

const initialState: ISearchParamsState = {
  minYield: 7,
  maxYield: 15,
  minPrice: 60,
  maxPrice: 110,
  minDuration: 6,
  maxDuration: 13,
  minVolumePerDay: 500,
  minVolumePerPeriod: 10000,
  OfferYesNo: true,
};

const searchParamsSlice = createSlice({
  name: 'searchParams',
  initialState,
  reducers: {
    setParam: <T>(state: T, action: PayloadAction<[param: keyof T, value: T[keyof T]]>) => {
      const [param, value] = action.payload;
      state[param] = value;
    },
    resetParams: () => initialState,
  },
});

export const { setParam, resetParams } = searchParamsSlice.actions;

export default searchParamsSlice.reducer;
