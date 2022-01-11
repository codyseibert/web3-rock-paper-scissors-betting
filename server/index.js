const express = require('express');
const Web3 = require('web3');
const app = express();
const cyrpto = require('crypto');
const Provider = require('@truffle/hdwallet-provider');
const cors = require('cors');

app.use(express.json());
app.use(cors());

const configuration = require('./configuration');
const provider = new Provider('2a869685823ad72c8dec1c5fc99fe949fcb8ff2d16fd9837f0faebbb76af9edd', 'http://127.0.0.1:7545'); 
const web3 = new Web3(provider);
web3.eth.defaultAccount = "0xd1b3a43B2F4520b90F720c6723230E11E08BDF3B";
const contractObj = new web3.eth.Contract(configuration.abi, configuration.address);

let salt;

app.post('/games', async (req, res) => {
  if (salt) {
    return res.status(400).send('Game already started');
  }

  let guess;
  if (Math.random() < 0.33) {
    guess = 'rock';
  } else if (Math.random() < 0.66) {
    guess = 'paper';
  } else {
    guess = 'scissors';
  }

  salt = cyrpto.randomBytes(32).toString('hex');
  const hash = web3.utils.keccak256(guess + salt)

  // save hash into web3 contract
  console.log('I picked', guess)
  await contractObj.methods.createGame(web3.fromAscii(hash)).send({ from: web3.eth.defaultAccount });
  // contractObj.methods.setCompleted(hash).send({from: req.body.playerAddress})

  res.json({message: 'game ready to play, your turn to shoot!'});
})

app.post('/end-game', async (req, res) => {
  await contractObj.methods.endGame(salt).send({from: web3.eth.defaultAccount});
  res.json({message: 'game finished!'});
});

console.log('server started')
app.listen(5000);