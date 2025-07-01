// Load Web3.js dynamically
function loadWeb3(callback) {
    if (typeof Web3 === "undefined") {
        console.log("Web3.js not found. Loading dynamically...");
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/web3/1.8.2/web3.min.js";
        script.onload = () => {
            console.log("Web3.js Loaded Successfully!");
            callback();
        };
        script.onerror = () => console.error("Failed to load Web3.js.");
        document.head.appendChild(script);
    } else {
        console.log("Web3.js is already available.");
        callback();
    }
}

// Global vars
let web3;
let contract;
const contractAddress = '0xfc0f79bf77eca5608c1e3d012ab19ce8eac1c504'; // Your contract address
const contractABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "_deviceId", "type": "string" },
            { "internalType": "int256", "name": "_temperature", "type": "int256" },
            { "internalType": "int256", "name": "_humidity", "type": "int256" },
            { "internalType": "int256", "name": "_lightIntensity", "type": "int256" }
        ],
        "name": "storeData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// MQTT Broker Details (HiveMQ Cloud)
const BROKER_URL = 'a191715f87f7420594f45623648a5246.s1.eu.hivemq.cloud';
const MQTT_PORT = 8884;
const CLIENT_ID = 'picoW01';
const USERNAME = 'hivemq.webclient.1739789243720';
const PASSWORD = '64xa<zf>t!Q2?I3ABsSR';

// Create MQTT Client
const client = new Paho.MQTT.Client(`wss://${BROKER_URL}:${MQTT_PORT}/mqtt`, CLIENT_ID);

// Connection options
const options = {
    userName: USERNAME,
    password: PASSWORD,
    onSuccess: onConnect,
    onFailure: onFailure,
    useSSL: true
};

// Start the app after Web3 loads
function startApp() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        ethereum.request({ method: 'eth_requestAccounts' })
            .then(accounts => {
                console.log("Connected MetaMask Account:", accounts[0]);
                contract = new web3.eth.Contract(contractABI, contractAddress);
                client.connect(options);
            })
            .catch(err => {
                console.error("MetaMask connection rejected:", err.message || err);
            });
    } else {
        console.error("MetaMask is not available. Please install it.");
    }
}

// When MQTT connected, publish data every 5 seconds
function onConnect() {
    console.log("Connected to HiveMQ Cloud MQTT Broker");

    setInterval(async () => {
        const data = {
            device_id: "Azure_RPi_Sim",
            temperature: (Math.random() * 10 + 20).toFixed(2),
            humidity: (Math.random() * 20 + 40).toFixed(2),
            light_intensity: (Math.random() * 900 + 100).toFixed(2),
            timestamp: Date.now(),
        };

        const message = new Paho.MQTT.Message(JSON.stringify(data));
        message.destinationName = "wokwi/picoW/sensors";
        client.send(message);
        console.log("Published Data:", data);

        await sendToBlockchain(data);
    }, 5000);
}

// Send data to blockchain
async function sendToBlockchain(data) {
    if (!contract) {
        console.error("Contract not initialized.");
        return;
    }
    try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        console.log("Using account:", account);

        const receipt = await contract.methods.storeData(
            data.device_id,
            parseInt(data.temperature),
            parseInt(data.humidity),
            parseInt(data.light_intensity)
        ).send({ from: account, gas: 300000 });

        console.log("Transaction complete:", receipt.transactionHash);
    } catch (error) {
        console.error("Error sending to blockchain:", error.message || error);
    }
}

// MQTT connection failure
function onFailure(error) {
    console.log("Connection failed: " + error.errorMessage);
}

// Load Web3 and start the app
loadWeb3(startApp);
