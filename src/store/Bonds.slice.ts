import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '.';

export interface Bond {
  id: string,
  bName?: string,
  boardGroup?: number,
  boardId?: string,
  bPrice?: number,
  bYield?: number,
  bDuration?: number,
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
  const url = `https://iss.moex.com/iss/securities/${bond.id}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,is_primary`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Error while loading data.');
  }

  const json = await response.json();
  const boardId = json.boards.data.find((e: [string, string, number]) => e[2])[1];
  return { ...bond, boardId };
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
        // minVolumePerDay
      }
    } = getState() as RootState;

    return Promise.all(boardGroups.map(async (boardGroup) => {
      const url =
        'https://iss.moex.com' +
        '/iss/engines/stock/markets/bonds/boardgroups/' + boardGroup + '/securities.json' +
        '?iss.dp=comma&iss.meta=off&iss.only=securities,marketdata' +
        '&securities.columns=SECID,SECNAME,PREVLEGALCLOSEPRICE&marketdata.columns=SECID,YIELD,DURATION';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error while loading data.');
      }

      const { securities, marketdata } = await response.json();

      const step1 = securities.data
        .reduce((acc: BondsObj, [id, bName, bPrice]: [string, string, string]) => {
          // ['SECID', 'SECNAME', 'PREVLEGALCLOSEPRICE']
          acc[id] = { id, boardGroup, bName, bPrice: parseFloat(bPrice) };
          return acc;
        }, {});

      const step2 = marketdata.data
        .reduce((acc: BondsObj, [id, bYield, bDuration]: [string, string, string]) => {
          // ['SECID', 'YIELD', 'DURATION']
          acc[id] = { ...acc[id], bYield: parseFloat(bYield), bDuration: parseInt(bDuration) / 30 };
          return acc;
        }, step1);

      const step3 = (Object.values(step2) as Bond[])
        .filter(({ bPrice = 0, bYield = 0, bDuration = 0 }) =>
          bYield >= minYield && bYield <= maxYield &&
          bPrice >= minPrice && bPrice <= maxPrice &&
          bDuration >= minDuration && bDuration <= maxDuration
        );

      const step4 = Promise.all((Object.values(step3) as Bond[]).map(MOEXGetBoardID));

      return step4;
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
