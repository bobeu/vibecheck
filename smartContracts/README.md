# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

<!-- yarn run v1.22.22
DEPLOYMENTS
===========
$ hardhat deploy --network alfajores --export deployments/contracts.json
Nothing to compile
No need to generate any newer typings.
deploying "Learna" (tx: 0x4361af1de8a45418b939e1a0630ed4723adb71df739d798cb72066d87142269a)...: deployed at 0x7B5C41A863604aE9dC5471Af977cbB3Effa365A7 with 1184780 gas
Learna contract deployed to: 0x7B5C41A863604aE9dC5471Af977cbB3Effa365A7
deploying "GrowToken" (tx: 0x030f885325bc7a4382be10343cdca50efe63551ce563f8e937fd0edf855acf6a)...: deployed at 0x26F833e9367f00E40EcFdF000aB6f7AbA9583CD1 with 794345 gas
GrowToken deployed to: 0x26F833e9367f00E40EcFdF000aB6f7AbA9583CD1
Done in 29.73s. -->


<!-- yarn run v1.22.22
$ hardhat deploy --network alfajores --export deployments/contracts.json
Nothing to compile
No need to generate any newer typings.
Admin 0xC0f6Ef6C8A58fB431015D4D2d7e0925718EaC010
deploying "Learna" (tx: 0xe884f1839ac0f0b1ad186ee364cb2e8311b066ff198028a992de081239c1ddaf)...: deployed at 0xdFb9C2595C38f2275f1adb5d8a71c8b29A7bad0e with 2457777 gas
Learna contract deployed to: 0xdFb9C2595C38f2275f1adb5d8a71c8b29A7bad0e
deploying "GrowToken" (tx: 0x426de36b55fbf6fd48043e8a3960ca5a216624bf168992efbc20e57f216c6111)...: deployed at 0xC92dE8aeDE6799c30D874bF273aB74A4eea01A35 with 794345 gas
GrowToken deployed to: 0xC92dE8aeDE6799c30D874bF273aB74A4eea01A35
Done in 34.11s. -->
<!-- 
$ hardhat deploy --network alfajores --export deployments/contracts.json
Nothing to compile
No need to generate any newer typings.
Admin 0xC0f6Ef6C8A58fB431015D4D2d7e0925718EaC010
deploying "Learna" (tx: 0x9eacfa70316d52c396509a9a29680a32b22588960cb2da9fbdf097e61c4775f3)...: deployed at 0x262EE780B100e9D2e3Cb1C7F86C4fA001b710FC7 with 2601865 gas
Learna contract deployed to: 0x262EE780B100e9D2e3Cb1C7F86C4fA001b710FC7
deploying "GrowToken" (tx: 0xeac0b47f1be49dc21099fe7bb17334a26ad79b558e507358bc3e8a97008e139d)...: deployed at 0x3824d0DaD2C9aE91dD9d96fc9c0295ef53d82D87 with 794321 gas
GrowToken deployed to: 0x3824d0DaD2C9aE91dD9d96fc9c0295ef53d82D87
Done in 65.88s. -->

<!-- Testnet
deployer 0xD7c271d20c9E323336bFC843AEb8deC23B346352
reusing "Learna" at 0x4AeDfE7137012679837bd7284d80FAfdC72513c6
Learna contract deployed to: 0x4AeDfE7137012679837bd7284d80FAfdC72513c6
reusing "GrowToken" at 0x0D42E9B84d11Ea4A66660E167546632619633799
GrowToken deployed to: 0x0D42E9B84d11Ea4A66660E167546632619633799
🔄 Syncing contracts data to Next App...
✅ Data synchronization completed!
Done in 28.43s. -->


<!-- Nothing to compile
No need to generate any newer typings.
Mode 1
deployer 0xa1f70ffA4322E3609dD905b41f17Bf3913366bC1
deploying "Learna" (tx: 0xbcc0f66b38658faae3252dbdbfa5458ecd973ffb57347da7a1bb8aceb2af8193)...: deployed at 0x9761496D5a1968B0320bb0059e4D0fDA29861805 with 2827477 gas
Learna contract deployed to: 0x9761496D5a1968B0320bb0059e4D0fDA29861805
deploying "GrowToken" (tx: 0xdd970aa0df26683148cf6bbc712bbff7e4870f409305493e0e920eba5c00df91)...: deployed at 0x800B1666d554e249FCCf5f0855455F43a140d2e5 with 794345 gas
GrowToken deployed to: 0x800B1666d554e249FCCf5f0855455F43a140d2e5
🔄 Syncing contracts data to Next App...
✅ Data synchronization completed!
Done in 48.95s -->

<!-- networkName celo
mode 1
transitionInterval 86400
deploying "FeeManager" (tx: 0xbd919926fde60c9be757b2d78be888fee9441007827e85da9a8cc147d0ba0812)...: deployed at 0xb8772c21f779d7b7fC37B1faD02c0850893D6518 with 307030 gas
Learna contract deployed to: 0xb8772c21f779d7b7fC37B1faD02c0850893D6518
deploying "Learna" (tx: 0x688af233ff52f2d087b9b3dfc518664edacb0cf40554b05c0108845bb6da7e5c)...: deployed at 0x78D92f85045cE169877f31A7424899B4Da83F2B4 with 6789930 gas
Learna contract deployed to: 0x78D92f85045cE169877f31A7424899B4Da83F2B4
deploying "GrowToken" (tx: 0x01caf37183fbc78f9d728c6470d1c8c732a61b4073702a3d807f2b7b0082d8ba)...: deployed at 0x1440779dedF0d5083F68229E01d1D42D5dc77819 with 834257 gas
GrowToken deployed to: 0x1440779dedF0d5083F68229E01d1D42D5dc77819
isAdmin1 true
isAdmin2 true
🔄 Syncing contracts data to Next App...
✅ Data synchronization completed!
Done in 30.34s. -->