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

// Start the application once Web3 is loaded
function startApp() {
    if (typeof Web3 !== "undefined") {
        window.web3 = new Web3(new Web3.providers.HttpProvider('https://sepolia.infura.io/v3/3eec87bf472e4fe689f3a686a6e49278'));
        console.log("Web3 initialized successfully:", web3);

        // Example: Fetch Ethereum accounts (only works if MetaMask is installed)
        web3.eth.getAccounts()
            .then(accounts => console.log("Ethereum Accounts:", accounts))
            .catch(error => console.error("Error fetching accounts:", error));
    } else {
        console.error("Web3.js failed to initialize.");
    }
}

// Load Web3.js and start the app
loadWeb3(startApp);

// Function to check MetaMask and get the user account
async function getAccount() {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install it to continue.');
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0]; // Return first connected MetaMask account
}

// MQTT Broker Details (HiveMQ Cloud)
const BROKER_URL = 'a191715f87f7420594f45623648a5246.s1.eu.hivemq.cloud';
const MQTT_PORT = 8884;
const CLIENT_ID = 'picoW01';
const USERNAME = 'hivemq.webclient.1739789243720';
const PASSWORD = '64xa<zf>t!Q2?I3ABsSR';

// Ethereum Blockchain (Sepolia) Setup
const INFURA_URL = 'https://developer.metamask.io/key/3eec87bf472e4fe689f3a686a6e49278'; // Replace with your Infura project ID
web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));

const contractAddress = '0xa9b9033e0f04c21b1339c7f794c4bdb81581f61e'; // Replace with your contract address
const contractABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
            { "indexed": false, "internalType": "string", "name": "deviceId", "type": "string" },
            { "indexed": false, "internalType": "int256", "name": "temperature", "type": "int256" },
            { "indexed": false, "internalType": "int256", "name": "humidity", "type": "int256" },
            { "indexed": false, "internalType": "int256", "name": "lightIntensity", "type": "int256" },
            { "indexed": false, "internalType": "bool", "name": "motionDetected", "type": "bool" },
            { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "name": "DataStored",
        "type": "event"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "_deviceId", "type": "string" },
            { "internalType": "int256", "name": "_temperature", "type": "int256" },
            { "internalType": "int256", "name": "_humidity", "type": "int256" },
            { "internalType": "int256", "name": "_lightIntensity", "type": "int256" },
            { "internalType": "bool", "name": "_motionDetected", "type": "bool" }
        ],
        "name": "storeData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const contract = new web3.eth.Contract(contractABI, contractAddress);

// Create MQTT Client
const client = new Paho.MQTT.Client(`wss://${BROKER_URL}:${MQTT_PORT}/mqtt`, CLIENT_ID);

// Connection options
const options = {
    userName: USERNAME,
    password: PASSWORD,
    onSuccess: onConnect,
    onFailure: onFailure
};

// Threshold values for anomaly detection
const THRESHOLDS = {
    temperature: { min: 18, max: 30 },
    humidity: { min: 30, max: 70 },
    light_intensity: { min: 200, max: 900 },
};

// Function for anomaly detection
function detectAnomaly(data) {
    const anomalies = [];
    if (data.temperature < THRESHOLDS.temperature.min || data.temperature > THRESHOLDS.temperature.max) {
        anomalies.push(`Temperature: ${data.temperature}°C`);
    }
    if (data.humidity < THRESHOLDS.humidity.min || data.humidity > THRESHOLDS.humidity.max) {
        anomalies.push(`Humidity: ${data.humidity}%`);
    }
    if (data.light_intensity < THRESHOLDS.light_intensity.min || data.light_intensity > THRESHOLDS.light_intensity.max) {
        anomalies.push(`Light Intensity: ${data.light_intensity} lux`);
    }
    return anomalies;
}

// Connect to HiveMQ MQTT Broker
client.connect(options);

// When connected, publish IoT data
function onConnect() {
    console.log("Connected to HiveMQ Cloud MQTT Broker");

    setInterval(async () => {
        const data = {
            device_id: "Azure_RPi_Sim",
            temperature: (Math.random() * 10 + 20).toFixed(2),
            humidity: (Math.random() * 20 + 40).toFixed(2),
            light_intensity: (Math.random() * 900 + 100).toFixed(2),
            motion_detected: Math.random() > 0.5,
            timestamp: Date.now(),
        };

        // Detect anomalies
        const anomalies = detectAnomaly(data);
        if (anomalies.length > 0) {
            console.log("Anomalies Detected:", anomalies.join(", "));
        }

        // Publish data to MQTT topic
        const message = new Paho.MQTT.Message(JSON.stringify(data));
        message.destinationName = "wokwi/picoW/sensors";
        client.send(message);
        console.log("Published Data:", data);

        // If no anomalies, send data to Ethereum blockchain
        if (anomalies.length === 0) {
            await sendToBlockchain(data);
        }

    }, 5000); // Publish data every 5 seconds
}

async function checkMetaMask() {
    if (!window.ethereum) {
        console.error("MetaMask is not installed!");
        return;
    }
    try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Connected Account:", accounts[0]);
    } catch (error) {
        console.error("MetaMask connection error:", error.message || error);
    }
}
checkMetaMask();



// Function to send data to Ethereum blockchain using MetaMask
async function sendToBlockchain(data) {
    try {
        console.log("Attempting to send data to blockchain...", data);

        if (!window.ethereum) {
            throw new Error("MetaMask is not installed or not detected.");
        }

        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const account = accounts[0];  // Get first account

        console.log("Using account:", account);

        const contract = new web3.eth.Contract(contractABI, contractAddress);
        console.log("Contract initialized:", contract);

        const tx = await contract.methods.storeData(
            data.device_id,
            parseInt(data.temperature),  // Ensure integer values
            parseInt(data.humidity),
            parseInt(data.light_intensity),
            data.motion_detected
        ).send({ from: account, gas: 300000 });

        console.log("Transaction successful! Hash:", tx.transactionHash);
    } catch (error) {
        console.error("Error sending to blockchain:", error.message || error);
    }
}

// Connection failure callback
function onFailure(error) {
    console.log("Connection failed: " + error.errorMessage);
    if (error.stack) {
        console.log("Error Stack:", error.stack);
    }
}
