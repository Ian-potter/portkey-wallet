import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tabs } from 'antd';
import { useNavigate } from 'react-router';
import BalanceCard from 'pages/components/BalanceCard';
import CustomTokenDrawer from 'pages/components/CustomTokenDrawer';
import { useTranslation } from 'react-i18next';
import TokenList from '../Tokens';
import Activity from '../Activity/index';
import { Transaction } from '@portkey-wallet/types/types-ca/trade';
import NFT from '../NFT/NFT';
import { useAppDispatch, useUserInfo, useWalletInfo, useAssetInfo, useCommonState } from 'store/Provider/hooks';
import {
  useCaAddresses,
  useCaAddressInfoList,
  useChainIdList,
  useCurrentWallet,
} from '@portkey-wallet/hooks/hooks-ca/wallet';
import { fetchTokenListAsync } from '@portkey-wallet/store/store-ca/assets/slice';
import { fetchAllTokenListAsync, getSymbolImagesAsync } from '@portkey-wallet/store/store-ca/tokenManagement/action';
import { getWalletNameAsync } from '@portkey-wallet/store/store-ca/wallet/actions';
import { useIsTestnet } from 'hooks/useNetwork';
import CustomTokenModal from 'pages/components/CustomTokenModal';
import { AccountAssetItem } from '@portkey-wallet/types/types-ca/token';
import { fetchBuyFiatListAsync, fetchSellFiatListAsync } from '@portkey-wallet/store/store-ca/payment/actions';
import { useFreshTokenPrice } from '@portkey-wallet/hooks/hooks-ca/useTokensPrice';
import { useAccountBalanceUSD } from '@portkey-wallet/hooks/hooks-ca/balances';
import useVerifierList from 'hooks/useVerifierList';
import useGuardianList from 'hooks/useGuardianList';
import './index.less';

export interface TransactionResult {
  total: number;
  items: Transaction[];
}

export default function MyBalance() {
  const { walletName } = useWalletInfo();
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<string>('assets');
  const [navTarget, setNavTarget] = useState<'send' | 'receive'>('send');
  const [tokenOpen, setTokenOpen] = useState(false);
  const {
    accountToken: { accountTokenList },
    accountBalance,
  } = useAssetInfo();
  const navigate = useNavigate();
  const { passwordSeed } = useUserInfo();
  const appDispatch = useAppDispatch();
  const caAddresses = useCaAddresses();
  const chainIdArray = useChainIdList();
  const isTestNet = useIsTestnet();
  const { walletInfo } = useCurrentWallet();
  const caAddressInfos = useCaAddressInfoList();
  const renderTabsData = useMemo(
    () => [
      {
        label: t('Tokens'),
        key: 'tokens',
        children: <TokenList tokenList={accountTokenList} />,
      },
      {
        label: t('NFTs'),
        key: 'nft',
        children: <NFT />,
      },
      {
        label: t('Activity'),
        key: 'activity',
        children: <Activity />,
      },
    ],
    [accountTokenList, t],
  );
  const accountBalanceUSD = useAccountBalanceUSD();
  const getGuardianList = useGuardianList();
  useFreshTokenPrice();
  useVerifierList();

  useEffect(() => {
    console.log('---passwordSeed-myBalance---', passwordSeed);
    if (!passwordSeed) return;
    appDispatch(fetchTokenListAsync({ caAddresses, caAddressInfos }));
    appDispatch(fetchAllTokenListAsync({ keyword: '', chainIdArray }));
    appDispatch(getWalletNameAsync());
    appDispatch(getSymbolImagesAsync());
    // appDispatch(fetchSellFiatListAsync());
  }, [passwordSeed, appDispatch, caAddresses, chainIdArray, caAddressInfos, isTestNet]);

  useEffect(() => {
    getGuardianList({ caHash: walletInfo?.caHash });
    !isTestNet && appDispatch(fetchBuyFiatListAsync());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestNet]);

  const onSelectedToken = useCallback(
    (v: AccountAssetItem, type: 'token' | 'nft') => {
      setTokenOpen(false);
      const isNFT = type === 'nft';
      const state = {
        chainId: v.chainId,
        decimals: isNFT ? 0 : v.tokenInfo?.decimals,
        address: isNFT ? v?.nftInfo?.tokenContractAddress : v?.tokenInfo?.tokenContractAddress,
        symbol: v.symbol,
        name: v.symbol,
        imageUrl: isNFT ? v.nftInfo?.imageUrl : '',
        alias: isNFT ? v.nftInfo?.alias : '',
        tokenId: isNFT ? v.nftInfo?.tokenId : '',
      };
      navigate(`/${navTarget}/${type}/${v.symbol}`, { state });
    },
    [navTarget, navigate],
  );

  const { isNotLessThan768 } = useCommonState();
  const SelectTokenELe = useMemo(() => {
    const title = navTarget === 'receive' ? 'Select Token' : 'Select Assets';
    const searchPlaceHolder = navTarget === 'receive' ? 'Search Token' : 'Search Assets';

    return isNotLessThan768 ? (
      <CustomTokenModal
        open={tokenOpen}
        drawerType={navTarget}
        title={title}
        searchPlaceHolder={searchPlaceHolder}
        onClose={() => setTokenOpen(false)}
        onChange={(v, type) => {
          onSelectedToken(v, type);
        }}
      />
    ) : (
      <CustomTokenDrawer
        open={tokenOpen}
        drawerType={navTarget}
        title={title}
        searchPlaceHolder={searchPlaceHolder}
        height="528"
        maskClosable={true}
        placement="bottom"
        onClose={() => setTokenOpen(false)}
        onChange={(v, type) => {
          onSelectedToken(v, type);
        }}
      />
    );
  }, [isNotLessThan768, navTarget, onSelectedToken, tokenOpen]);

  const onChange = useCallback(async (key: string) => {
    setActiveKey(key);
  }, []);

  const handleBuy = useCallback(() => {
    const path = isTestNet ? '/buy-test' : '/buy';
    navigate(path);
  }, [isTestNet, navigate]);

  return (
    <div className="balance">
      <div className="wallet-name">{walletName}</div>
      <div className="balance-amount">
        {isTestNet ? (
          <span className="dev-mode amount">Dev Mode</span>
        ) : (
          <span className="amount">{`$ ${accountBalanceUSD}`}</span>
        )}
      </div>
      <BalanceCard
        amount={accountBalance}
        isShowBuy={true}
        onBuy={handleBuy}
        onSend={() => {
          setNavTarget('send');
          return setTokenOpen(true);
        }}
        onReceive={() => {
          setNavTarget('receive');
          return setTokenOpen(true);
        }}
      />
      {SelectTokenELe}
      <Tabs accessKey={activeKey} onChange={onChange} centered items={renderTabsData} />
    </div>
  );
}
