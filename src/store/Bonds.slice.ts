import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '.';
import { format, subDays } from 'date-fns';
import { MOEX_BASE_URL, GET_TRADES_DAYS, MIN_TRADES_DAYS } from '../constants';

export interface Bond {
  id: string,
  bName?: string,
  boardGroup?: number,
  boardId?: string,
  bPrice?: number,
  bYield?: number,
  bDuration?: number,
  bTradesData?: {
    date: string,       // дата торгов
    volume: number,     // объем сделок в количестве бумаг (шт)
    // numtrades: number,  // количество сделок (шт)
  }[]
}

export interface BondsState {
  bonds: Bond[],

  status: 'pending' | 'fullfiled' | 'rejected' | 'idle',
  error: string | unknown,
}

const initialState: BondsState = {
  bonds: [],
  status: 'idle',
  error: '',
};

interface BondsObj {
  [key: string]: Bond;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

const MOEXGetBoardID = async (bond: Bond): Promise<Bond> => {
  const url = MOEX_BASE_URL +
    `securities/${bond.id}.json?iss.meta=off&iss.only=boards&boards.columns=boardid,is_primary`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Error while loading data.');
  }

  const json = await response.json();
  const boardId = json.boards.data.find((e: [string, number]) => e[1])[0];
  return { ...bond, boardId };
};

const startDate = format(subDays(new Date(), GET_TRADES_DAYS), 'yyyy-MM-dd');

const MOEXGetVolume = async (bond: Bond): Promise<Bond> => {
  const { boardId, id } = bond;

  const url = MOEX_BASE_URL +
    `history/engines/stock/markets/bonds/boards/${boardId}/securities/${id}.json` +
    `?iss.meta=off&iss.only=history&history.columns=TRADEDATE,VOLUME&limit=20&from=${startDate}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Error while loading data.');
  }

  const json = await response.json();
  const bTradesData = json.history.data
    .map(([date, volume]: [string, number, number]) => ({ date, volume }));

  return { ...bond, bTradesData };
};

const boardGroups = [7, 58, 193, 245];

export const fetchBonds = createAsyncThunk(
  'bonds/fetchBonds',
  async (_, { rejectWithValue, getState }) => {
    const { searchParams:
      {
        minPrice, maxPrice,
        minDuration, maxDuration,
        minYield, maxYield,
        minVolumePerDay, minVolumePerPeriod,

      }
    } = getState() as RootState;

    return Promise.all(boardGroups.map(async (boardGroup) => {
      const url = MOEX_BASE_URL +
        'engines/stock/markets/bonds/boardgroups/' + boardGroup + '/securities.json' +
        '?iss.dp=comma&iss.meta=off&iss.only=securities,marketdata' +
        '&securities.columns=SECID,SECNAME,PREVLEGALCLOSEPRICE&marketdata.columns=SECID,YIELD,DURATION';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error while loading data.');
      }

      const { securities, marketdata } = await response.json();

      // Получаем основные данные - тикер, название, цену,
      const step1 = securities.data
        .reduce((acc: BondsObj, [id, bName, bPrice]: [string, string, string]) => {
          // ['SECID', 'SECNAME', 'PREVLEGALCLOSEPRICE']
          acc[id] = { id, boardGroup, bName, bPrice: parseFloat(bPrice) };
          return acc;
        }, {});

      // Получаем данные по доходности и дюрации
      const step2 = marketdata.data
        .reduce((acc: BondsObj, [id, bYield, bDuration]: [string, string, string]) => {
          // ['SECID', 'YIELD', 'DURATION']
          acc[id] = { ...acc[id], bYield: parseFloat(bYield), bDuration: parseInt(bDuration) / 30 };
          return acc;
        }, step1);

      // Фильтруем по имеющимся на данный момент данным
      const step3 = (Object.values(step2) as Bond[])
        .filter(({ bPrice = 0, bYield = 0, bDuration = 0 }) =>
          bYield >= minYield && bYield <= maxYield &&
          bPrice >= minPrice && bPrice <= maxPrice &&
          bDuration >= minDuration && bDuration <= maxDuration
        );

      // Получаем данные об основном режиме торгов (будут нужны далее)
      const step4 = await Promise.all(step3.map(MOEXGetBoardID));

      // Получаем данные о количестве и объеме сделок
      const step5 = await Promise.all(step4.map(MOEXGetVolume));

      // Фильтруем по количеству и объему сделок
      const step6 = step5.filter((bond) => {
        const { bTradesData = [] } = bond;

        // Активные торги по бумаге были менее 6 дней из последних 15;
        if (bTradesData.length < MIN_TRADES_DAYS) return false;

        let sum = 0;
        for (let i = 0; i < bTradesData.length; i++) {
          if (bTradesData[i].volume < minVolumePerDay) return false;
          sum += bTradesData[i].volume;
        }

        return sum >= minVolumePerPeriod;
      });

      return step6;
    }))
      .then((res) => res.flat())
      .catch((error) => rejectWithValue(getErrorMessage(error)));
  }
);

const bondsSlice = createSlice({
  name: 'bonds',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchBonds.pending, (state) => {
      state.status = 'pending';
    });
    builder.addCase(fetchBonds.fulfilled, (state, action) => {
      state.bonds = action.payload;
      state.status = 'fullfiled';
    });
    builder.addCase(fetchBonds.rejected, (state, action) => {
      state.error = action.payload;
      state.status = 'rejected';
    });
  }
});

export default bondsSlice.reducer;
