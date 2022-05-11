import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftaddress, ntfmarketaddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function MyAssets() {
  const [nfts, setNFTs] = useState([]);
  const [loadingState, setLoadingState] = useState("loading");

  useEffect(() => {
    loadNFTs();
  }, []);

  async function loadNFTs() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const marketContract = new ethers.Contract(
      ntfmarketaddress,
      NFTMarket.abi,
      signer
    );
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, signer);
    const data = await marketContract.fetchMyNFTs();

    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), "wei");
        let item = {
          itemId: i.itemId.toNumber(),
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        };
        return item;
      })
    );
    setNFTs(items);
    setLoadingState("loaded");
    console.log(items);
  }

  if (loadingState === "loaded" && !nfts.length)
    return <h1 className="py-10 px-20 text-3xl"> No assets owned </h1>;

  return (
    <div className="flex flex-col justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {" "}
          {nfts.map((nft, i) => (
            <div key={i} className="border shadow rounded-xl">
              <div className="h-96 overflow-hidden">
                <img src={nft.image} />{" "}
              </div>{" "}
              <div className="p-2">
                <p className="text-2xl font-semibold h-10"> {nft.name} </p>{" "}
                <div style={{ height: "70px" }}>
                  <p className="text-gray-400 line-clamp-3">
                    {" "}
                    {nft.description}{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <div className="p-g bg-black">
                <p className="text-2xl p-4 font-bold text-white">
                  {" "}
                  {nft.price}{" "}
                  WEI{" "}
                </p>{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
