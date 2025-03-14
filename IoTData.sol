// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IoTData {
    struct SensorReading {
        uint256 timestamp;
        string deviceId;
        int256 temperature;
        int256 humidity;
        int256 lightIntensity;
    }

    mapping(uint256 => SensorReading) public readings;
    uint256 public readingCount;

    event DataStored(
        uint256 indexed id,
        string deviceId,
        int256 temperature,
        int256 humidity,
        int256 lightIntensity,
        uint256 timestamp
    );

    function storeData(
        string memory _deviceId,
        int256 _temperature,
        int256 _humidity,
        int256 _lightIntensity
    ) public {
        readings[readingCount] = SensorReading(
            block.timestamp,
            _deviceId,
            _temperature,
            _humidity,
            _lightIntensity
        );

        emit DataStored(
            readingCount,
            _deviceId,
            _temperature,
            _humidity,
            _lightIntensity,
            block.timestamp
        );

        readingCount++;
    }

    function getData(uint256 _id) public view returns (SensorReading memory) {
        require(_id < readingCount, "Invalid ID");
        return readings[_id];
    }
}
