import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { SearchParams } from '../components/SearchParams';
import { Bond } from '../store/Bonds.slice';
import styles from './Main.module.css';

export const MainPage = () => {
  const { bonds, status, error } = useSelector(({ bonds }: RootState) => bonds);

  return (
    <div className={styles.container}>
      <SearchParams />
      <h3>Found bonds ({bonds.length}) {status}</h3>
      {status === 'pending' && <span>Loading data</span>}

      {status === 'fullfiled' &&
        <div>
          {bonds.map((b: Bond) =>
            <div key={`${b.id}_${b.boardGroup}`}>
              {`${b.id} ${b.bName} Доходность: ${b.bYield} Дюрация: ${b.bDuration} Цена: ${b.bPrice} `}
            </div>
          )}
        </div>
      }
      {error ? <span>{`An error occured: ${error}`}</span> : null}
      {/*
      <h3>My bonds</h3>
      <h3>Chart</h3> */}
    </div>
  );
};
