import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from 'web3modal'

import { nftaddress, ntfmarketaddress } from "../config";

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function Home() {
  const [nfts, setNFTs] = useState([])
  const [loadingState, setLoadingState] = useState('loading')

  useEffect(() => {
    loadNFTs()
  }, [])

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/")
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(ntfmarketaddress, NFTMarket.abi, provider)
    const data = await marketContract.fetchMarketItems()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'wei')
      let item = {
        itemId: i.itemId.toNumber(),
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    setNFTs(items)
    setLoadingState('loaded')
    console.log(items)
  }

  async function buyNFT(nft) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const contract = new ethers.Contract(ntfmarketaddress, NFTMarket.abi, signer)

    const price = ethers.utils.parseUnits(nft.price.toString(), 'wei')
    console.log(price)
    const transaction = await contract.createMarketSale(nftaddress, nft.itemId, { value: price })
    await transaction.wait()

    loadNFTs()

  }

  if (loadingState === 'loaded' && !nfts.length) return (
    <h1 className="px-20 py-10 text-3xl">There is not any item in marketplace!</h1>
  )

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} />
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-g bg-black">
                  <p className="text-2xl p-4 font-bold text-white">{nft.price} WEI</p>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNFT(nft)}>Buy This Asset</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>

    </div>
  )
}