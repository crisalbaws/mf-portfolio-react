import { HashRouter as Router, Route, Routes } from 'react-router-dom';

function Default() {
  return <h1>DEFAULT</h1>;
}

function Examples() {
  return <h1>HOLA</h1>;
}

export default function Root(props) {
  return (
    <Router>
      <Routes>
        <Route path="/react/examples" element={<Examples />} />
        <Route path="/react" element={<Default />} />
      </Routes>
    </Router>
  );
}
