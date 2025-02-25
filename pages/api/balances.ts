import { checkOrigin } from './../../lib/cors';
import { formatError } from './../../lib/errors';
import { getPrivk, getProvider } from './../../lib/interfaces'
import { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers'
import { loadAbi } from '../../contracts/abi'
import { getContractAddress } from '../../contracts/addresses'
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
          const roleBytes = ethers.utils.toUtf8Bytes('ADMIN_ROLE')
          const roleHash = ethers.utils.keccak256(roleBytes)
          console.log({ roleHash })
    await checkOrigin(req)
    const { network } = req.query
    const fweb3FaucetAddress = getContractAddress(
      network.toString(),
      'fweb3TokenFaucet'
    )
    const provider = getProvider(network.toString())
    const privk = getPrivk(network.toString()) || ''
    const wallet = new ethers.Wallet(privk, provider)

    const fweb3TokenAddress = getContractAddress(
      network.toString(),
      'fweb3Token'
    )
    const maticFaucetAddress = getContractAddress(
      network.toString(),
      'fweb3MaticFaucet'
    )
    const fweb3FaucetAbi = loadAbi('fweb3TokenFaucet')
    const fweb3TokenAbi = loadAbi('fweb3Token')
    const maticFaucetAbi = loadAbi('fweb3MaticFaucet')

    const fweb3Faucet = new ethers.Contract(
      fweb3FaucetAddress,
      fweb3FaucetAbi,
      wallet
    )

    const fweb3Token = new ethers.Contract(
      fweb3TokenAddress,
      fweb3TokenAbi,
      wallet
    )

    const maticFaucet = new ethers.Contract(
      maticFaucetAddress,
      maticFaucetAbi,
      wallet
    )

    const fweb3Drip = await fweb3Faucet.dripAmount()
    const fweb3Balance = await fweb3Token.balanceOf(fweb3FaucetAddress)
    const fweb3MaticBalance = await provider.getBalance(fweb3FaucetAddress)
    const maticDrip = await maticFaucet.dripAmount()
    const maticFaucetBalance = await provider.getBalance(maticFaucetAddress)

    res.status(200).json({
      fweb3: {
        token_balance: fweb3Balance.toString(),
        matic_balance: fweb3MaticBalance.toString(),
        drip_amount: fweb3Drip.toString(),
      },
      matic: {
        matic_balance: maticFaucetBalance.toString(),
        drip_amount: maticDrip.toString(),
      },
    })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ status: 'error', error: formatError(e), code: e.code })
  }
}
