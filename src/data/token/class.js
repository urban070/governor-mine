import ERC20 from "./abi/ERC20.json";
import {
  testnet,
  USDCWETHAddress,
  GDAOAddress,
  GDAOWETHLPAddress,
  farmAddress,
} from "../../utilities/constants/constants";

export default class Token {
  constructor(address, lpAddress, name, text, unit, logo) {
    this.address = address;
    this.lpAddress = lpAddress;
    this.name = name;
    this.text = text;
    this.unit = unit;
    this.logo = logo;
    // Values below will be fetched
    this.contract = null;
    this.lpContract = null;
    this.depositable = null;
    this.price = null;

    this.deposited = null;
    this.earnings = null;
    this.rewards = null;
    this.apy = null;
    this.tvl = null;
  }

  async getContract(w3) {
    if (w3.isAddressValid(this.address)) {
      this.contract = await new w3.web3.eth.Contract(ERC20.abi, this.address);
    }
  }

  async getLPContract(w3) {
    if (w3.isAddressValid(this.lpAddress)) {
      this.lpContract = await new w3.web3.eth.Contract(
        ERC20.abi,
        this.lpAddress
      );
    }
  }

  async getPrice(w3, wethContract, usdcContract) {
    if (w3.isAddressValid(this.lpAddress)) {
      let p;
      let xB;
      let w = await wethContract.methods.balanceOf(this.lpAddress).call();
      let wB = await w3.getWeiToETH(w);

      if (this.name === "GDAO / ETH") {
        let wB2x = wB * 2; // 2x number of WETH in (GDAO-WETH)
        let tS = await this.lpContract.methods.totalSupply().call(); // Total Supply of (GDAO-WETH)
        let tSB = await w3.getWeiToETH(tS);
        p = wB2x / tSB; // Price in ETH
      } else {
        let x = await this.contract.methods.balanceOf(this.lpAddress).call();
        if (this.name === "USDC") {
          xB = x / 10 ** 6;
        } else if (this.name === "WBTC") {
          xB = x / 10 ** 8;
        } else {
          xB = await w3.getWeiToETH(x);
        }
        p = wB / xB; // Price in ETH
      }

      if (testnet) {
        this.price = p * 650;
      } else {
        let i = await wethContract.methods.balanceOf(USDCWETHAddress).call();
        let iB = await w3.getWeiToETH(i);
        let j = await usdcContract.methods.balanceOf(USDCWETHAddress).call();
        let jB = j / 10 ** 6;
        let ijP = jB / iB; // Price of WETH in USDC
        this.price = p * ijP; // Price of Token in USDC
      }
    }
  }

  async getAPY(w3, wethContract, usdcContract) {
    if (w3.isAddressValid(this.address)) {
      let bB;
      const gdaoPrice = await this.getGDAOPrice(w3, wethContract, usdcContract);
      const xBy = this.name === "GDAO / ETH" ? 400000 : 100000;
      let b = await this.contract.methods.balanceOf(farmAddress).call();

      if (this.name === "USDC") {
        bB = b / 10 ** 6;
      } else if (this.name === "WBTC") {
        bB = b / 10 ** 8;
      } else {
        bB = await w3.getWeiToETH(b);
      }

      let n = gdaoPrice * xBy;
      let d = this.price * bB;
      let apy = n / d;
      this.apy = Math.round((apy + Number.EPSILON) * 100) / 100;
    }
  }

  async getGDAOPrice(w3, wethContract, usdcContract) {
    let p;
    let GDAOWETHLPContract = await new w3.web3.eth.Contract(
      ERC20.abi,
      GDAOWETHLPAddress
    );

    let w = await wethContract.methods.balanceOf(GDAOWETHLPAddress).call();
    let wB = await w3.getWeiToETH(w);
    let wB2x = wB * 2; // 2x number of WETH in (GDAO-WETH)
    let tS = await GDAOWETHLPContract.methods.totalSupply().call(); // Total Supply of (GDAO-WETH)
    let tSB = await w3.getWeiToETH(tS);
    p = wB2x / tSB; // Price in ETH

    if (testnet) {
      return p * 650;
    } else {
      let i = await wethContract.methods.balanceOf(USDCWETHAddress).call();
      let iB = await w3.getWeiToETH(i);
      let j = await usdcContract.methods.balanceOf(USDCWETHAddress).call();
      let jB = j / 10 ** 6;
      let ijP = jB / iB; // Price of WETH in USDC
      return p * ijP; // Price of Token in USDC
    }
  }

  async getTVL(w3) {
    if (w3.isAddressValid(this.address)) {
      let bB;
      let b = await this.contract.methods.balanceOf(farmAddress).call();
      if (this.name === "USDC") {
        bB = b / 10 ** 6;
      } else if (this.name === "WBTC") {
        bB = b / 10 ** 8;
      } else {
        bB = await w3.getWeiToETH(b);
      }
      this.tvl = bB * this.price;
    }
  }

  async getDepositable(w3, address) {
    if (w3.isAddressValid() && w3.isAddressValid(address)) {
      let b = await this.contract.methods.balanceOf(w3.address).call();
      this.depositable = await w3.getWeiToETH(b);
    }
  }
}
