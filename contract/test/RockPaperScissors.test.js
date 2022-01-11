const RockPaperScissors = artifacts.require("RockPaperScissors");
const truffleAssert = require('truffle-assertions');

contract("RockPaperScissors", (accounts) => {

  const PAPER_HASH = '0x4907548afe6cb6e86f40e5567fde3da95addc127f00d44383aa02dd930785624';
  const SALT = 'salt'
  const STAKE_AMOUNT = 1e17;
  const INITIAL_AMOUNT = 1e18;

  const OWNER = accounts[0];
  const PLAYER = accounts[1];
  const DEPOSITOR = accounts[2];

  // it('should do stuff', async () => {
  //   const instance = await RockPaperScissors.deployed()
  //   web3.eth.getGasPrice(async (error, res) => { 
  //     const gasPrice = Number(res);
  //     const randomHash = web3.utils.keccak256('paper');
  //     const result = await instance.endGame.estimateGas('paper');
  //     const gas = Number(result);
  //     console.log("gas estimation = " + gas + " units");
  //     console.log("gas cost estimation = " + (gas * gasPrice) + " wei");
  //     console.log("gas cost estimation = " + (gas * gasPrice / 1e18) + " eth");
  //     console.log("gas cost estimation = " + (gas * gasPrice / 1e18 / 0.00033101438) + " usd");
  //   });
  // });

  it("should allow anyone to fund the contract", async () => {
    const instance = await RockPaperScissors.deployed()
    await instance.fundContract({from: DEPOSITOR, value: INITIAL_AMOUNT})
    const balance = await web3.eth.getBalance(instance.address)
    assert.equal(
      balance.valueOf(),
      1e18,
      "balance was not set correctly when funding the contract"
    );
  });

  it("should create a new game and set the owner hash to paper", async () => {
    const instance = await RockPaperScissors.deployed()
    await instance.createGame(PAPER_HASH, {from: OWNER})
    const ownerHash = await instance.ownerGuessHash.call();
    assert.equal(
      ownerHash.valueOf(),
      PAPER_HASH,
      "ownerGuessHash was not set correctly when creating a new game"
    );
  });

  it("should allow a player to guess scissors", async () => {
    const instance = await RockPaperScissors.deployed()
    await instance.play('scissors', {from: PLAYER, value: STAKE_AMOUNT})
    const playerStake = await instance.playerStake.call();
    const playerGuess = await instance.playerGuess.call();
    const player = await instance.player.call();
    assert.equal(
      playerStake.valueOf(),
      1e17,
      "playerStake was not set correctly when guessing"
    );
    assert.equal(
      playerGuess.valueOf(),
      'scissors',
      "playerGuess was not set correctly when guessing"
    );
    assert.equal(
      player.valueOf(),
      PLAYER,
      "player was not set correctly when guessing"
    );
  });

  it('should send funds to player who won with scissors', async () => {
    const instance = await RockPaperScissors.deployed()
    const CONTRACT_ADDR = instance.address;
    const initialPlayerBalance = await web3.eth.getBalance(PLAYER);
    const initialContractBalance = await web3.eth.getBalance(CONTRACT_ADDR);

    // end the game
    const result = await instance.endGame(SALT, {from: OWNER})

    const playerBalance = await web3.eth.getBalance(PLAYER)
    const contractBalance = await web3.eth.getBalance(CONTRACT_ADDR)
    const diff = BigInt(playerBalance) - BigInt(initialPlayerBalance);
    const contractBalanceDifference = BigInt(contractBalance) - BigInt(initialContractBalance);
    assert.equal(diff, BigInt(`${2 * STAKE_AMOUNT}`), 'player balance was increased by 2x the stake amount');
    assert.equal(contractBalanceDifference, BigInt(`${-2 * STAKE_AMOUNT}`), 'owner balance was decreased by 2x the stake amount');
    truffleAssert.eventEmitted(result, 'PlayerWins');
  });

  it('should reset the game state to be ready for the next game', async () => {
    const instance = await RockPaperScissors.deployed()
    const playerStake = await instance.playerStake.call();
    const playerGuess = await instance.playerGuess.call();
    const ownerGuessHash = await instance.ownerGuessHash.call();
    assert.equal(
      playerStake,
      0x0000000000000000000000000000000000000000000000000000000000000000,
      "player stake was reset to zero"
    );
    assert.equal(
      playerGuess,
      0x0000000000000000000000000000000000000000000000000000000000000000,
      "player guess reset"
    );
    assert.equal(
      ownerGuessHash,
      0x0000000000000000000000000000000000000000000000000000000000000000,
      "owner guess reset"
    );
  });
});