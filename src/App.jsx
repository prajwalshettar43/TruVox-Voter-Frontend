import { useState } from "react"
import FaceVerification from "./components/FaceVerification"
import { Route,Routes } from "react-router-dom"
import VotePage from "./components/VotePage";
import { ToastContainer,Bounce } from 'react-toastify';
function App() {
  const [epicId,setEpicId] = useState("");
  return (
    <>
    <Routes>
      <Route path="/" element={<FaceVerification epicId={epicId} setEpicId={setEpicId}/>}></Route>
      <Route path="/vote" element={<VotePage epicId={epicId} setEpicId={setEpicId}/>}></Route>
    </Routes>
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      transition={Bounce}
      />
    </>
  )
}

export default App
