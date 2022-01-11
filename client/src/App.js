import './App.css';
import { useState, useEffect} from 'react'
import Web3 from 'web3';
import {configuration} from './configuration.js';

const CONTRACT_ADDRESS = configuration.address;
const CONTRACT_ABI = configuration.abi;

const web3 = new Web3(Web3.givenProvider || 'http://127.0.0.1:7545');
const contractObj = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

const LOBBY = 0;
const GUESS = 1;
const RESULT = 2;

function App() {
  const [account, setAccount] = useState();
  const [stake, setStake] = useState(1e17);
  const [completed, setCompleted] = useState();
  const [gameState, setGameState] = useState(LOBBY);

  useEffect(() => {
    async function load() {
      const accounts = await web3.eth.requestAccounts();
      const selectedAccount = accounts[0];
      setAccount(selectedAccount);
      const ownerHash = await contractObj.methods.ownerGuessHash().call();
      console.log(ownerHash)
      if (ownerHash) {
        setGameState(GUESS)
      }
    }
    
    load();
   }, []);

   const createGame = async () => {
      await fetch('http://localhost:5000/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      })
      setGameState(GUESS);
   }

   const guess = async (guess) => {
      await contractObj.methods.play(guess).send({from: account, value: stake})
      await fetch('http://localhost:5000/end-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      })
      setGameState(RESULT);
   }

  
   return (
     <div>
       Your account is: {account}
       <br />
       completed: {completed}
       <br />
       {gameState === LOBBY && (
         <>
          <button onClick={createGame}>create game</button>)
        </>
       )}
       {gameState === GUESS && (
         <>
          <label>amount to stake:
            <input value={stake} type="number" onChange={(e) => setStake(+e.currentTarget.value)}></input>
          </label>
            <button onClick={() => guess('rock')}>rock</button>
            <button onClick={() => guess('paper')}>paper</button>
            <button onClick={() => guess('scissors')}>scissors</button>
        </>
       )}
        {gameState === RESULT && (
          <>
          game over
          <button onClick={() => setGameState(LOBBY)}>to lobby</button>
          </>
        )}
     </div>
   );
}

export default App;
