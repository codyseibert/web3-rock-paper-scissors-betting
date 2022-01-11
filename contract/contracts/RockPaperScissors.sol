// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract RockPaperScissors {
    address public owner = msg.sender;
    address payable public player;
    bytes32 public ownerGuessHash;
    string public playerGuess;
    uint256 public playerStake = 0;

    modifier restricted() {
        require(
            msg.sender == owner,
            "This function is restricted to the contract's owner"
        );
        _;
    }

    event Tie();
    event OwnerWins();
    event PlayerWins();

    function compareStrings(string memory a, string memory b)
        public
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    function append(string memory a, string memory b)
        internal
        pure
        returns (string memory)
    {
        return string(bytes.concat(bytes(a), bytes(b)));
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function fundContract() external payable {}

    function createGame(bytes32 _ownerGuessHash) public restricted {
        ownerGuessHash = _ownerGuessHash;
    }

    function play(string memory _playerGuess) external payable {
        playerGuess = _playerGuess;
        playerStake = msg.value;
        player = payable(msg.sender);
    }

    function endGame(string memory _ownerGuessSalt) public restricted {
        bool isOwnerRock = keccak256(
            abi.encodePacked(append("rock", _ownerGuessSalt))
        ) == ownerGuessHash;
        bool isOwnerPaper = keccak256(
            abi.encodePacked(append("paper", _ownerGuessSalt))
        ) == ownerGuessHash;
        bool isOwnerScissors = keccak256(
            abi.encodePacked(append("scissors", _ownerGuessSalt))
        ) == ownerGuessHash;

        bool isPlayerRock = compareStrings("rock", playerGuess);
        bool isPlayerPaper = compareStrings("paper", playerGuess);
        bool isPlayerScissors = compareStrings("scissors", playerGuess);

        if (
            (isOwnerRock && isPlayerRock) ||
            (isOwnerPaper && isPlayerPaper) ||
            (isOwnerScissors && isPlayerScissors)
        ) {
            emit Tie();
        } else if (
            (isOwnerRock && isPlayerPaper) ||
            (isOwnerPaper && isPlayerScissors) ||
            (isOwnerScissors && isPlayerRock)
        ) {
            (bool success, ) = player.call{value: 2 * playerStake}("");
            require(success, "Transfer failed.");
            emit PlayerWins();
        } else if (
            (isOwnerRock && isPlayerScissors) ||
            (isOwnerPaper && isPlayerRock) ||
            (isOwnerScissors && isPlayerPaper)
        ) {
            emit OwnerWins();
        }
        playerStake = 0;
        ownerGuessHash = "";
        playerGuess = "";
        player = payable(address(0));
    }
}
