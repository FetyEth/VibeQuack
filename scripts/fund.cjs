
const hre = require("hardhat");
async function main() {
  const [signer] = await hre.ethers.getSigners();
  const tx = await signer.sendTransaction({
    to: "0x86d256bc8dDb3af0F4b9050d4F45945553168B3e",
    value: hre.ethers.parseEther("0.001")
  });
  await tx.wait();
  console.log("TxHash:", tx.hash);
}
main().catch(console.error);
