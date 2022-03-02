import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import axios from "axios";
import Web3Modal from 'web3modal'

import { nftaddress, ntfmarketaddress } from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function CreatorDashboard() {
    const [nfts, setNFTs] = useState([])
    const [sold, setSold] = useState([])
    const [loadingState, setLoadingState] = useState('loading')

    useEffect(() => {
        loadNFTs()
    }, [])

    async function loadNFTs() {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        const marketContract = new ethers.Contract(ntfmarketaddress, NFTMarket.abi, signer)
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, signer)
        const data = await marketContract.fetchMyNFTs()

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
                sold: i.sold
            }
            return item
        }))

        const soldItems = items.filter(i => i.sold)
        setSold(soldItems)
        setNFTs(items)
        setLoadingState('loaded')
    }

    if (loadingState === 'loaded' && !nfts.length) return (
        <h1 className='py-10 px-20 text-3xl'> No assets owned</h1>
    )

    return (
        <div className='flex justify-center'>
            <div className='p-4'>
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
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>

            <div className='p-4'>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                        sold.map((nftSold, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nftSold.image} />
                                <div className="p-4">
                                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nftSold.name}</p>
                                    <div style={{ height: '70px', overflow: 'hidden' }}>
                                        <p className="text-gray-400">{nftSold.description}</p>
                                    </div>
                                </div>
                                <div className="p-g bg-black">
                                    <p className="text-2xl p-4 font-bold text-white">{nftSold.price} WEI</p>
                                    <p className="text-2xl p-4 font-bold text-white bg-pink-500">SOLD OUT</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}