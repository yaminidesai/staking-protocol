// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Staking {
    IERC20 public stakingToken;

    mapping(address => uint256) public stakedBalance;

    mapping(address => uint256) public stakingStartTime;

    // Rewards already earned but not claimed
    mapping(address => uint256) public pendingRewards;

    // 10% Annual Percentage Rate
    uint256 public constant APR = 10;

    // Number of seconds in one year
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // Events
    event Staked(address indexed user, uint256 amount);

    event Withdrawn(address indexed user, uint256 amount);

    event RewardClaimed(address indexed user, uint256 amount);

    event RewardsFunded(address indexed funder, uint256 amount);

    event EmergencyWithdrawn(address indexed user, uint256 amount);

    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // Save rewards earned before changing the stake
        _updateRewards(msg.sender);

        stakingToken.transferFrom(msg.sender, address(this), amount);

        stakedBalance[msg.sender] += amount;

        // Restart reward calculation
        stakingStartTime[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        require(
            stakedBalance[msg.sender] >= amount,
            "Insufficient staked balance"
        );

        // Save rewards earned before changing the stake
        _updateRewards(msg.sender);

        stakedBalance[msg.sender] -= amount;

        // Restart reward calculation
        stakingStartTime[msg.sender] = block.timestamp;

        stakingToken.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function fundRewards(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        stakingToken.transferFrom(msg.sender, address(this), amount);

        emit RewardsFunded(msg.sender, amount);
    }

    function calculateReward(address user) public view returns (uint256) {
        uint256 currentReward = 0;

        if (stakedBalance[user] > 0) {
            uint256 stakingDuration = block.timestamp - stakingStartTime[user];

            currentReward =
                (stakedBalance[user] * APR * stakingDuration) /
                (100 * SECONDS_PER_YEAR);
        }

        return pendingRewards[user] + currentReward;
    }

    function claimReward() external {
        uint256 reward = calculateReward(msg.sender);

        require(reward > 0, "No reward available");

        require(
            stakingToken.balanceOf(address(this)) >= reward,
            "Insufficient reward balance"
        );

        // Clear accumulated rewards
        pendingRewards[msg.sender] = 0;

        // Restart reward calculation
        stakingStartTime[msg.sender] = block.timestamp;

        // Send reward to user
        stakingToken.transfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, reward);
    }

    function emergencyWithdraw() external {
        uint256 amount = stakedBalance[msg.sender];

        require(amount > 0, "No staked balance");

        // Reset all staking information
        stakedBalance[msg.sender] = 0;
        stakingStartTime[msg.sender] = 0;
        pendingRewards[msg.sender] = 0;

        // Return only principal
        stakingToken.transfer(msg.sender, amount);

        emit EmergencyWithdrawn(msg.sender, amount);
    }

    function _updateRewards(address user) internal {
        if (stakedBalance[user] > 0 && stakingStartTime[user] > 0) {
            uint256 stakingDuration = block.timestamp - stakingStartTime[user];

            uint256 reward = (stakedBalance[user] * APR * stakingDuration) /
                (100 * SECONDS_PER_YEAR);

            pendingRewards[user] += reward;
        }

        stakingStartTime[user] = block.timestamp;
    }
}
