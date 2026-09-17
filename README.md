# Staking Protocol

A Solidity-based ERC-20 staking protocol developed as a blockchain project. The project demonstrates token staking, time-based reward calculations, reward claiming, reward funding, emergency withdrawals, and automated smart contract testing using Hardhat.

## Project Overview

This project allows users to:

- Stake ERC-20 tokens in a smart contract.
- Earn rewards based on a 10% annual percentage rate (APR).
- Withdraw their staked tokens.
- Claim accumulated rewards.
- Fund the protocol's reward pool.
- Perform emergency withdrawals that return their principal while forfeiting rewards.

The project focuses on understanding fundamental DeFi and smart contract development concepts.

## Features

- ERC-20 token integration using OpenZeppelin interfaces.
- Token staking using `transferFrom()`.
- Token withdrawals.
- Time-based reward calculations using `block.timestamp`.
- 10% APR reward model.
- Reward checkpointing when users stake additional tokens or withdraw.
- Reward claiming.
- Reward pool funding.
- Emergency withdrawal.
- Solidity events for important contract actions.
- Automated testing using Hardhat and Ethers.js.

## Architecture

```text
                 ERC-20 Token
                      |
          +-----------+-----------+
          |                       |
          v                       v
    User deposits           Reward Provider
       tokens               funds rewards
          |                       |
          +-----------+-----------+
                      |
                      v
              Staking Contract
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       Stake      Calculate     Claim
                   Rewards      Rewards
          |
          v
      Withdraw
```

### Main Components

#### Staking Contract

`contracts/Staking.sol`

Responsible for:

- Managing user staking balances.
- Tracking staking start times.
- Calculating rewards.
- Storing pending rewards.
- Processing withdrawals.
- Processing reward claims.
- Receiving reward funding.
- Handling emergency withdrawals.
- Emitting events.

#### Test Token

`contracts/TestToken.sol`

A local ERC-20 token used for development and testing.

The contract uses OpenZeppelin's ERC-20 implementation.

## Reward Formula

The protocol uses a simple 10% APR model.

```text
Reward =
    (Staked Amount × APR × Staking Duration)
    / (100 × Seconds Per Year)
```

Where:

```text
APR = 10
Seconds Per Year = 365 days
```

### Example

If a user stakes 1,000 tokens for one year:

```text
Reward =
    (1,000 × 10 × 1 year)
    / (100 × 1 year)

Reward = 100 tokens
```

The user would earn approximately 100 tokens over one year, assuming the stake remains unchanged.

### Reward Checkpointing

When a user stakes additional tokens or withdraws part of their stake:

1. Previously earned rewards are calculated.
2. Those rewards are stored in `pendingRewards`.
3. The staking timestamp is reset.
4. The new staking balance is recorded.

This prevents previously earned rewards from being lost when the user's balance changes.

## Technology Stack

- Solidity
- Hardhat
- Ethers.js
- TypeScript
- OpenZeppelin Contracts
- Mocha
- Chai
- Node.js
- Git and GitHub

## Project Structure

```text
Staking-Protocol/
│
├── contracts/
│   ├── Staking.sol
│   └── TestToken.sol
│
├── test/
│   └── Staking.ts
│
├── scripts/
│
├── ignition/
│
├── hardhat.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## Installation

Clone the repository:

```bash
git clone https://github.com/yaminidesai/staking-protocol.git
```

Navigate to the project:

```bash
cd staking-protocol
```

Install dependencies:

```bash
npm install
```

## Run Tests

Run the complete test suite:

```bash
npx hardhat test
```

Expected result:

```text
15 passing
```

The test suite covers:

- Contract deployment.
- Token staking.
- Token withdrawals.
- Zero-amount validation.
- Insufficient balance validation.
- Staking timestamps.
- APR reward calculations.
- Reward claiming.
- Reward timer resets.
- No-reward validation.
- Emergency withdrawals.
- Reward forfeiture.
- Multiple staking deposits.
- Reward pool funding.
- Staking event emission.

## Security Considerations

This is an educational project and has not been audited.

Potential improvements for production use include:

- Using safe ERC-20 transfer wrappers.
- Adding access control for protocol administration.
- Separating principal accounting from reward accounting.
- Preventing reward pool funds from being confused with user principal.
- Adding more comprehensive security tests.
- Reviewing reentrancy and token compatibility.
- Adding explicit reward funding and accounting mechanisms.
- Performing an independent smart contract security audit.

## Learning Objectives

This project was created to practice:

- Solidity smart contract development.
- ERC-20 token interactions.
- DeFi staking mechanics.
- Time-based calculations.
- Reward accounting.
- Solidity events.
- Hardhat testing.
- Blockchain transaction behavior.
- Smart contract validation and error handling.

## Future Improvements

Possible future enhancements include:

- Improved reward pool accounting.
- Access-controlled reward administration.
- More comprehensive event tests.
- Gas optimization.
- Additional security testing.
- Multiple staking pools.
- Lock periods.
- Reward multipliers.

These features are not currently implemented.

## Disclaimer

This project is intended for educational purposes only. It is not production-ready and should not be used to manage real funds.
