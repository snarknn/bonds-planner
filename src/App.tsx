import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { MainPage } from './pages/Main';
// import { DetailsPage } from './Pages/Details';

import { store } from './store';

const App = () =>
  <Provider store={store}>
    <Router>
      <Routes>
        <Route path={`${process.env.PUBLIC_URL}/`} element={<MainPage />} />
        {/* <Route path="/details/:factory_id/:year/:month" element={<DetailsPage />} /> */}
        <Route path="*" element={<Navigate to={`${process.env.PUBLIC_URL}/`} />} />
      </Routes>
    </Router>
  </Provider>;

export default App;
