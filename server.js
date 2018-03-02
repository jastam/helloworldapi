const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8484 });

var Web3 = require('web3');

var settings = require('./settings.js');

var web3 = new Web3(settings.host);

const account = web3.eth.accounts.privateKeyToAccount(settings.accountPrivatekey);

const contract = new web3.eth.Contract(
    [{'anonymous':false,'inputs':[{'indexed':false,'name':'newMessage','type':'string'}],'name':'MessageSet','type':'event'},{'constant':true,'inputs':[],'name':'getMessage','outputs':[{'name':'message','type':'string'}],'payable':false,'stateMutability':'view','type':'function'},{'constant':false,'inputs':[{'name':'newMessage','type':'string'}],'name':'setMessage','outputs':[],'payable':false,'stateMutability':'nonpayable','type':'function'}],
    settings.contractAddress,
    null
);


wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', function connection(ws) {

    ws.on('error', function(error) {
        // do nothing
    });

    ws.on('message', function incoming(message) {
        const event = JSON.parse(message);
        switch (event.eventName) {
            case 'setMessage':
            setMessage(event.eventData.newMessage);
            break;
        }
    });

    
    const getMessage = contract.methods.getMessage();
    getMessage.call().then((message) => {
        const event = JSON.stringify({
            eventName: 'MessageSet',
            eventData: {
                newMessage: message
            }
        });
        ws.send(event);
    }).catch((error) => {
        throw new Error(error);
    });

});


contract.events.MessageSet()
.on('data', function(event){
    console.log('Event:')
    console.log(event);
    wss.broadcast(JSON.stringify({
        eventName: 'MessageSet',
        eventData: {
            newMessage: event.returnValues.newMessage
        }
    }));
})
.on('changed', function(event){
    console.log('Changed:')
    console.log(event);
})
.on('error', function(error){
    console.log('Error:')
    console.log(error);
});


setMessage = function(newMessage) {
    const setMessage = contract.methods.setMessage(newMessage);

    // setMessage.send({ from: account.address}).then(console.log);

    const trx = {
        from: account.address,
        to: settings.contractAddress,
        chainId: settings.chainId,
        gas: 4700000,
        gasPrice: 0,
        data: setMessage.encodeABI(),
    };

    console.log(trx);

    var result = web3.eth.accounts.signTransaction(trx, account.privateKey)
    .then((sgnTrx) => {
        return web3.eth.sendSignedTransaction(sgnTrx.rawTransaction);
    }).then((result) => {
        console.log(result);
        return result;
    }).catch((error) => {
        throw new Error(error);
    });
};