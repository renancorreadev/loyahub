import { useState, useEffect, useCallback, useRef } from 'react';
import { axiosConfig } from '@/helpers/config';
import { toast } from 'sonner';

// Interfaces para tipagem
interface AddressLocal {
  City: string;
  Street: string;
  PostalCode: number;
  HouseNumber: number;
}

interface ClientData {
  clientID: number;
  name: string;
  age: number;
  walletAddress: string;
  paymentStatus: number;
  addressLocal: AddressLocal;
}

interface Benefit {
  description: string;
  discount?: string;
  FreeFrete?: string;
  promotionLevel?: string;
  doublePoints?: string;
  gifts?: string;
  priority?: string;
  birthdays?: string;
}

interface Attribute {
  type: string;
  value: number | string | Benefit[];
}

export interface InsignyMetadata {
  tokenID: number;
  customer: string;
  description: string;
  image: string;
  insight: string;
  attributes: Attribute[];
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Limitar o número de requisições por minuto
let requestCounter = 0;
const MAX_REQUESTS_PER_MINUTE = 5;
const resetTime = 60 * 1000; // 1 minuto

// Reseta o contador de requisições a cada minuto
setInterval(() => {
  requestCounter = 0;
}, resetTime);

// Cache para armazenar resultados de requisições anteriores
const metadataCache: Record<string, {
  data: InsignyMetadata;
  timestamp: number;
}> = {};

// Tempo de validade do cache em milissegundos (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

export const useFetchClientMetadadaInsigny = (userId: string | number | null) => {
  const [metadata, setMetadata] = useState<InsignyMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<number>(0);
  const isMounted = useRef(true);
  const fetchingRef = useRef(false);
  
  // Evitar que o userID mude constantemente se for uma string
  const stableUserId = typeof userId === 'string' ? userId.trim() : userId;
  const cacheKey = stableUserId ? String(stableUserId) : '';

  const refreshMetadata = useCallback(() => {
    // Limpar o cache para esse ID
    if (cacheKey) {
      delete metadataCache[cacheKey];
    }
    setRefresh(prev => prev + 1);
  }, [cacheKey]);

  useEffect(() => {
    isMounted.current = true;
    
    // Cleanup para evitar atualizações de estado após desmontagem
    return () => {
      isMounted.current = false;
      fetchingRef.current = false;
    };
  }, []);

  // Verificar se deve buscar dados
  useEffect(() => {
    if (!stableUserId) {
      setLoading(false);
      return;
    }

    // Se já estiver fazendo fetch, não iniciar outro
    if (fetchingRef.current || requestCounter >= MAX_REQUESTS_PER_MINUTE) {
      return;
    }

    // Verificar cache
    const cachedData = metadataCache[cacheKey];
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      // Usar dados do cache se estiverem válidos
      console.log('Usando dados do cache para userId:', stableUserId);
      setMetadata(cachedData.data);
      setLoading(false);
      return;
    }

    let isActive = true;
    fetchingRef.current = true;
    setLoading(true);

    const fetchMetadata = async () => {
      if (!isMounted.current) return;
      
      setError(null);
      
      try {
        console.log(`Buscando metadados para userId: ${stableUserId}`);
        requestCounter++;
        
        const metadataResponse = await axiosConfig.get<InsignyMetadata>(
          `/api/v1/metadata/${stableUserId}`
        );
        
        if (isActive && isMounted.current) {
          const data = metadataResponse.data;
          
          // Armazenar no cache
          metadataCache[cacheKey] = {
            data,
            timestamp: Date.now()
          };
          
          setMetadata(data);
        }
      } catch (error) {
        console.error('Erro ao buscar metadados da insígnia:', error);
        
        if (isActive && isMounted.current) {
          setError('Não foi possível carregar os dados da insígnia');
          toast.error('Erro ao carregar dados da insígnia');
        }
      } finally {
        if (isActive && isMounted.current) {
          setLoading(false);
        }
        fetchingRef.current = false;
      }
    };

    fetchMetadata();

    return () => {
      isActive = false;
    };
  }, [stableUserId, refresh, cacheKey]);

  return { metadata, loading, error, refreshMetadata };
}; 