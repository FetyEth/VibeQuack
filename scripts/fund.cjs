
const hre = require("hardhat");
async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Sender:", signer.address);
  
  const tx = await signer.sendTransaction({
    to: "0xD852e89873Cebda2712348EF32858BaECf06dbd4",
    value: hre.ethers.parseEther("0.001")
  });
  
  console.log("Waiting for blocks...");
  await tx.wait();
  console.log("TxHash:", tx.hash);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
