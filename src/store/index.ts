import { configureStore } from '@reduxjs/toolkit';
import bonds from './Bonds.slice';
import searchParams from './SearchParams.slice';

export const store = configureStore({
  reducer: { bonds, searchParams },
  devTools: {
    name: 'BondsPlanner',
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

