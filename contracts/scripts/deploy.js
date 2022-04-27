// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const Toopi = await hre.ethers.getContractFactory("Toopi");
  const toopi = await Toopi.deploy("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199");
  await toopi.deployed();
  console.log("Toopi deployed to:", toopi.address);

  const JT = await hre.ethers.getContractFactory("JungelTycoon");
  const jt = await JT.deploy("JTT", "JTT", "https://", "https://");
  await jt.deployed();
  console.log("JungelTycoon deployed to:", jt.address)

  const StakingFarm = await hre.ethers.getContractFactory("NftStakingFarm");
  const sf = await StakingFarm.deploy(toopi.address, jt.address);
  await sf.deployed();
  console.log("NFTStakingFarm deployed to: ", sf.address);

  const MintReward = await hre.ethers.getContractFactory("MintReward");
  const mintReward = await MintReward.deploy(jt.address, toopi.address, 5);
  await mintReward.deployed();
  console.log("MintReward deployed to: ", mintReward.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
