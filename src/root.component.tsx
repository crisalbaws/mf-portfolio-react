import {
  useNavigate,
  HashRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import ProductList from "./Components/ProductList";
import WeatherPage from "./Components/Weather";
import CarTrackingMap from "./Components/CarTrackingMap";
import { useEffect } from "react";

function Default() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/react/product/list");
  }, [navigate]);
  return <></>;
}

export default function Root(props) {
  return (
    <Router>
      <Routes>
        <Route path="/react" element={<Default />} />
        <Route path="/react/product/list" element={<ProductList />} />
        <Route path="/react/weather" element={<WeatherPage />} />
        <Route path="/react/tracking" element={<CarTrackingMap />} />
      </Routes>
    </Router>
  );
}
