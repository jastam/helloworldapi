pragma solidity ^0.4.17;

contract HelloWorld {

    event MessageSet(string newMessage);

    string private _message = "Eerste bericht";

    function HelloWorld() public {

    }

    function getMessage() public view returns (string message) {
        return _message;
    }

    function setMessage(string message) public {
        _message = message;
        MessageSet(message);
    } 
}