import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserStore } from '@/store/store';
import { 
  useFetchDrexBalance, 
  useFetchPoints, 
  useFetchMetadata,
  useFetchTransfers,
  useFetchClientMetadadaInsigny
} from '@/hooks';
import { formatAddress, formatUsername } from '@/utils/formatters';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  WalletIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  ArrowPathIcon,
  BookmarkIcon,
  IdentificationIcon,
  MapPinIcon,
  CreditCardIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  SparklesIcon,
  StarIcon,
  GiftIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { useModal } from '@/context/modal-provider';
import { ModalTransferTokens } from '../Dashboard/ModalTransferTokens';
import { Toaster } from '@/components/ui';

// Componente principal - usando memo para evitar renderizações desnecessárias
export const ProfilePage: React.FC = React.memo(() => {
  // Estado para controlar manualmente quando buscar dados
  const [shouldRefresh, setShouldRefresh] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Desativar auto-refresh após primeira carga
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoRefresh(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const { email, userData } = useUserStore();
  const userId = userData?.id;
  const walletAddress = userData?.walletAddress;
  
  // Para debugging
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Função para atualizar todos os dados manualmente
  const refreshAllData = useCallback(() => {
    setShouldRefresh(prev => prev + 1);
  }, []);
  
  // Estabilizar userId para hooks
  const stableUserId = useMemo(() => userId?.toString() || undefined, [userId]);
  
  // Todos os hooks de busca de dados
  const { drexBalance, loading: drexLoading, refreshDrexBalance } = useFetchDrexBalance(email);
  const { points, loading: pointsLoading } = useFetchPoints(stableUserId);
  const { metadata } = useFetchMetadata(stableUserId);
  const { transfers, loading: transfersLoading, refreshTransfers } = useFetchTransfers(walletAddress);
  
  // Usar autoRefresh para controlar se o hook deve ser executado
  const { 
    metadata: insignyMetadata, 
    loading: insignyLoading, 
    error: insignyError,
    refreshMetadata: refreshInsigny 
  } = useFetchClientMetadadaInsigny(autoRefresh ? (userId || null) : null);
  
  // Status de carregamento consolidado
  const isLoading = useMemo(() => {
    return drexLoading || pointsLoading || insignyLoading || transfersLoading;
  }, [drexLoading, pointsLoading, insignyLoading, transfersLoading]);
  
  // Para controle de debugging
  useEffect(() => {
    // Mostrar debug apenas durante o carregamento ou em caso de erro - com dependências estáveis
    if (process.env.NODE_ENV === 'development') {
      const statusMessage = insignyLoading 
        ? `UserId: ${userId}, Insígnia carregando`
        : insignyError 
          ? `UserId: ${userId}, Erro: ${insignyError}` 
          : null;
      
      setDebugInfo(statusMessage);
    }
    // Dependência estável para evitar loops
  }, [userId, Boolean(insignyLoading), insignyError]);
  
  const { openModal } = useModal();
  
  // Função para formatar o saldo corretamente
  const formatBalance = useCallback((balance: string | null): string => {
    if (balance === null) return 'N/A';
    // Mostramos o valor como está, já que ele vem formatado do hook
    return balance;
  }, []);

  const paymentStatusText = useMemo(() => {
    return userData?.paymentStatus === 0
      ? 'Pendente'
      : userData?.paymentStatus === 1
        ? 'Completo'
        : 'Indefinido';
  }, [userData?.paymentStatus]);

  const paymentStatusColor = useMemo(() => {
    return userData?.paymentStatus === 0
      ? 'text-yellow-600'
      : 'text-green-600';
  }, [userData?.paymentStatus]);

  // Função para obter o ícone baseado no nível da insígnia (memorizada)
  const getLevelIcon = useCallback((level: number) => {
    switch (level) {
      case 1:
        return <StarIcon className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <TrophyIcon className="h-6 w-6 text-yellow-600" />;
      case 3:
        return <SparklesIcon className="h-6 w-6 text-purple-600" />;
      default:
        return <BookmarkIcon className="h-6 w-6 text-gray-400" />;
    }
  }, []);

  // Função para obter a cor de fundo do cabeçalho baseada no nível (memorizada)
  const getHeaderGradient = useCallback((level: number) => {
    switch (level) {
      case 1:
        return "bg-gradient-to-r from-blue-50 to-indigo-50";
      case 2:
        return "bg-gradient-to-r from-yellow-50 to-amber-50";
      case 3:
        return "bg-gradient-to-r from-purple-50 to-fuchsia-50";
      default:
        return "bg-gradient-to-r from-gray-50 to-slate-50";
    }
  }, []);

  // Função para obter o badge do nível (memorizada)
  const getLevelBadge = useCallback((level: number) => {
    switch (level) {
      case 1:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Nível I - Premium
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Nível II - Gold
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Nível III - Titanium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Sem Nível
          </span>
        );
    }
  }, []);

  if (!userData) return <div className="p-6">Carregando dados do usuário...</div>;

  // Memorizar transferências filtradas para evitar recálculos
  const receivedTransfers = transfers ? transfers.filter(
    (transfer) => transfer.to.toLowerCase() === walletAddress?.toLowerCase()
  ) : [];
  
  const sentTransfers = transfers ? transfers.filter(
    (transfer) => transfer.from.toLowerCase() === walletAddress?.toLowerCase()
  ) : [];

  // Renderizar o card de insígnia com estado de carregamento
  const renderInsignyCard = () => {
    // Se estiver carregando
    if (insignyLoading) {
      return (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <BookmarkIcon className="h-6 w-6 text-gray-400" />
                <span className="ml-2">Insígnia NFT de Fidelidade</span>
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-8">
              {/* Imagem em loading */}
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-3xl h-64 rounded-xl overflow-hidden bg-gray-200 animate-pulse mb-4"></div>
                <div className="w-48 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-96 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Benefícios em loading */}
              <div className="w-full">
                <div className="bg-gray-200 rounded-lg h-20 animate-pulse mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-16 animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Se houver erro
    if (insignyError) {
      return (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-red-100 bg-gradient-to-r from-red-50 to-pink-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center text-red-600">
                <BookmarkIcon className="h-6 w-6 mr-2" />
                Insígnia NFT de Fidelidade
              </h3>
            </div>
          </div>
          <div className="p-6 text-center">
            <p className="text-red-500">Erro ao carregar dados da insígnia: {insignyError}</p>
            <button 
              onClick={refreshInsigny}
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    // Se tiver dados
    if (insignyMetadata) {
      const level = insignyMetadata.attributes[0]?.value as number || 0;
      
      return (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className={`px-6 py-5 border-b border-gray-100 ${getHeaderGradient(level)}`}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                {getLevelIcon(level)}
                <span className="ml-2">Insígnia NFT de Fidelidade</span>
              </h3>
              {getLevelBadge(level)}
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-8">
              {/* Imagem em destaque - 100% horizontal */}
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-3xl rounded-xl overflow-hidden shadow-lg border-2 border-gray-100 mb-4 transition-transform duration-300 hover:scale-105">
                  <img 
                    src={insignyMetadata.image} 
                    alt={`Insígnia ${insignyMetadata.insight}`} 
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="text-center mt-2">
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">
                    {insignyMetadata.attributes[1]?.value ? String(insignyMetadata.attributes[1].value) : 'Sem NFT'}
                  </h4>
                  <p className="text-sm text-gray-500 max-w-xl">
                    {insignyMetadata.description}
                  </p>
                </div>
              </div>

              {/* Benefícios - Layout melhorado */}
              <div className="w-full">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-4">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center mb-2">
                    <StarIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Benefícios do Nível {level}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Você desbloqueia estes benefícios especiais com sua insígnia {insignyMetadata.insight}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {renderBenefits(insignyMetadata.attributes[2]?.value as any[] || [])}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Caso não tenha dados (nem erro, nem carregando)
    return (
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center">
              <BookmarkIcon className="h-6 w-6 text-gray-400" />
              <span className="ml-2">Insígnia NFT de Fidelidade</span>
            </h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500">Nenhuma insígnia disponível</p>
          <button 
            onClick={refreshInsigny}
            className="mt-4 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm"
          >
            Verificar insígnias
          </button>
        </div>
      </div>
    );
  };

  // Função para renderizar os benefícios com ícones
  const renderBenefits = (benefits: any[]) => {
    if (!benefits || benefits.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 col-span-full">
          <p>Nenhum benefício disponível neste nível</p>
        </div>
      );
    }

    return (
      <>
        {benefits.map((benefit, idx) => {
          let icon = <StarIcon className="h-5 w-5 text-purple-500" />;
          let bgColor = "bg-purple-50";
          let textColor = "text-purple-700";
          
          if (benefit.discount) {
            icon = <CurrencyDollarIcon className="h-5 w-5 text-green-500" />;
            bgColor = "bg-green-50";
            textColor = "text-green-700";
          } else if (benefit.FreeFrete) {
            icon = <TrophyIcon className="h-5 w-5 text-blue-500" />;
            bgColor = "bg-blue-50";
            textColor = "text-blue-700";
          } else if (benefit.doublePoints) {
            icon = <SparklesIcon className="h-5 w-5 text-yellow-500" />;
            bgColor = "bg-yellow-50";
            textColor = "text-yellow-700";
          } else if (benefit.gifts) {
            icon = <GiftIcon className="h-5 w-5 text-red-500" />;
            bgColor = "bg-red-50";
            textColor = "text-red-700";
          }
          
          return (
            <div 
              key={idx} 
              className={`flex p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 ${bgColor}`}
            >
              <div className="flex-shrink-0 mr-3">
                {icon}
              </div>
              <div>
                <p className="text-gray-700 text-sm font-medium">
                  {benefit.description}
                </p>
                <p className={`text-sm font-semibold ${textColor}`}>
                  {benefit.discount || 
                   benefit.FreeFrete || 
                   benefit.promotionLevel || 
                   benefit.doublePoints ||
                   benefit.gifts ||
                   benefit.priority ||
                   benefit.birthdays}
                </p>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col">
      <Toaster />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
        {/* Cabeçalho do perfil */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white mb-4">
            <UserCircleIcon className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {email ? formatUsername(email) : 'Usuário'}
          </h1>
          <p className="text-gray-500">{email}</p>
          
          {/* Debug Info - só exibe em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <p className="mt-2 text-xs text-red-400 bg-red-50 p-2 rounded">{debugInfo}</p>
          )}
          
          {/* Botão para atualizar manualmente */}
          <button
            onClick={refreshAllData}
            disabled={isLoading}
            className="mt-4 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm flex items-center mx-auto"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Atualizando...' : 'Atualizar Dados'}
          </button>
        </div>

        {/* Card de Insígnia NFT com estados de carregamento/erro/vazio */}
        {renderInsignyCard()}

        {/* Cards de informações - Primeira Linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Card de informações pessoais */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <h3 className="text-lg font-semibold flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2 text-purple-600" />
                Informações Pessoais
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <EnvelopeIcon className="h-4 w-4 mr-1" />
                  Email
                </div>
                <p className="text-gray-800">{email}</p>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <IdentificationIcon className="h-4 w-4 mr-1" />
                  Idade
                </div>
                <p className="text-gray-800">
                  {userData?.age || 'Não informado'}
                </p>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  Endereço
                </div>
                <p className="text-gray-800">
                  {userData?.address ? `${userData.address.City}, ${userData.address.Street}, Nº ${userData.address.HouseNumber} - ${userData.address.PostalCode}` : 'Não informado'}
                </p>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <CreditCardIcon className="h-4 w-4 mr-1" />
                  Status de Pagamento
                </div>
                <p className={`text-gray-800 font-medium ${paymentStatusColor}`}>
                  {paymentStatusText}
                </p>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <WalletIcon className="h-4 w-4 mr-1" />
                  Endereço da Carteira
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <code className="text-xs bg-gray-100 p-2 rounded font-mono text-gray-800 break-all">
                    {userData.walletAddress}
                  </code>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                    {formatAddress(userData.walletAddress)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card de saldo e pontos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <h3 className="text-lg font-semibold flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-purple-600" />
                Saldo e Pontos
              </h3>
            </div>
            <div className="px-6 py-4 space-y-5">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  Saldo DREX
                </div>
                <div className="flex items-center">
                  <div className="bg-purple-100 text-purple-800 rounded-lg px-4 py-2 flex items-center">
                    <span className="text-2xl font-bold mr-2">
                      {drexLoading ? "..." : formatBalance(drexBalance)}
                    </span>
                    <button 
                      onClick={() => refreshDrexBalance()} 
                      disabled={drexLoading}
                      className="ml-2 p-1.5 bg-white rounded-full text-purple-700 hover:bg-purple-50 transition-colors"
                      title="Atualizar saldo"
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${drexLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <button
                    onClick={openModal}
                    className="ml-3 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Transferir
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <BookmarkIcon className="h-4 w-4 mr-1" />
                  Pontos
                </div>
                <div className="bg-indigo-100 text-indigo-800 rounded-lg px-4 py-2">
                  <span className="text-2xl font-bold">
                    {pointsLoading ? "..." : (points !== null ? points : 'N/A')}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Atividade Recente
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500 flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {transfers && transfers.length > 0 
                    ? `Última transação: ${transfers[0].blockTimestamp}`
                    : 'Nenhuma transação recente encontrada'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        {walletAddress && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-purple-600" />
                Histórico de Transações
              </h3>
              <button
                onClick={refreshTransfers}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors text-sm flex items-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Atualizar
              </button>
            </div>
            <div className="p-5">
              {transfersLoading ? (
                <p className="text-gray-500 text-center py-4">Carregando transações...</p>
              ) : !transfers || transfers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma transação encontrada</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recebidas */}
                  <div className="border border-green-100 rounded-lg overflow-hidden">
                    <div className="bg-green-50 px-4 py-3 border-b border-green-100">
                      <h4 className="font-medium text-green-800 flex items-center">
                        <ArrowUpCircleIcon className="h-4 w-4 mr-1 text-green-600" />
                        Recebidas
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {receivedTransfers.length > 0 ? (
                        receivedTransfers.slice(0, 5).map((transfer) => (
                          <div key={transfer.id} className="p-3 hover:bg-gray-50">
                            <div className="flex justify-between">
                              <div className="text-sm">
                                <p className="text-gray-600">
                                  {transfer.blockTimestamp}
                                </p>
                                <a 
                                  href={`https://etherscan.io/tx/${transfer.transactionHash}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline text-xs"
                                >
                                  {transfer.transactionHash.slice(0, 10)}...
                                </a>
                              </div>
                              <span className="font-medium text-green-600">
                                + {transfer.formattedValue}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-center text-sm text-gray-500">
                          Nenhuma transferência recebida
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Enviadas */}
                  <div className="border border-red-100 rounded-lg overflow-hidden">
                    <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                      <h4 className="font-medium text-red-800 flex items-center">
                        <ArrowDownCircleIcon className="h-4 w-4 mr-1 text-red-600" />
                        Enviadas
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {sentTransfers.length > 0 ? (
                        sentTransfers.slice(0, 5).map((transfer) => (
                          <div key={transfer.id} className="p-3 hover:bg-gray-50">
                            <div className="flex justify-between">
                              <div className="text-sm">
                                <p className="text-gray-600">
                                  {transfer.blockTimestamp}
                                </p>
                                <a 
                                  href={`https://etherscan.io/tx/${transfer.transactionHash}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline text-xs"
                                >
                                  {transfer.transactionHash.slice(0, 10)}...
                                </a>
                              </div>
                              <span className="font-medium text-red-600">
                                - {transfer.formattedValue}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-center text-sm text-gray-500">
                          Nenhuma transferência enviada
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
            <h3 className="text-lg font-semibold">Ações Rápidas</h3>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-200 transition-colors text-gray-700">
              <svg className="h-6 w-6 mb-2 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="text-sm">Transferir</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-200 transition-colors text-gray-700">
              <svg className="h-6 w-6 mb-2 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Depositar</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-200 transition-colors text-gray-700">
              <svg className="h-6 w-6 mb-2 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-sm">Histórico</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-200 transition-colors text-gray-700">
              <svg className="h-6 w-6 mb-2 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Configurações</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal de transferência */}
      <ModalTransferTokens
        email={email ?? ''}
        sender={walletAddress ?? ''}
        refreshDrexBalance={refreshDrexBalance}
        onTransferSuccess={refreshTransfers}
      />
    </div>
  );
});

export default ProfilePage; 