/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Label, Progress } from '@/components/ui';
import { register as apiRegister } from '@/helpers/api/customer-api';
import {
  UserRegisterParamsType,
  UserRegisterResponse,
} from '@/helpers/@types/api-types';
import { AxiosResponse } from 'axios';
import { toast, Toaster } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, User, Home, MapPin, Lock, Check, AlertCircle } from 'lucide-react';

// Schema de validação com Zod
const registerSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres'),
  profileImageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  age: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 18, {
    message: 'Você deve ter pelo menos 18 anos',
  }),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
  confirmPassword: z.string(),
  address: z.object({
    City: z.string().min(1, 'Cidade é obrigatória'),
    Street: z.string().min(1, 'Rua é obrigatória'),
    PostalCode: z.string().min(1, 'CEP é obrigatório'),
    HouseNumber: z.string().min(1, 'Número é obrigatório'),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormType = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  // Função para calcular força da senha
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    // Comprimento
    if (password.length >= 8) strength += 20;
    // Letra maiúscula
    if (/[A-Z]/.test(password)) strength += 20;
    // Letra minúscula
    if (/[a-z]/.test(password)) strength += 20;
    // Número
    if (/[0-9]/.test(password)) strength += 20;
    // Caractere especial
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    
    return strength;
  };

  // Função para mostrar cor da força da senha
  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors, isValid, dirtyFields },
  } = useForm<RegisterFormType>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });
  
  const navigate = useNavigate();
  const [processingStep, setProcessingStep] = useState<{
    isLoading: boolean;
    step: number;
    message: string;
  }>({
    isLoading: false,
    step: 0,
    message: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const password = watch('password') || '';
  const passwordStrength = calculatePasswordStrength(password);

  const onSubmit = async (data: RegisterFormType) => {
    // Iniciar processo
    setProcessingStep({
      isLoading: true,
      step: 1,
      message: 'Iniciando registro do usuário...',
    });
    
    try {
      // Simulando etapas de processamento
      setProcessingStep({
        isLoading: true,
        step: 2,
        message: 'Verificando dados...',
      });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcessingStep({
        isLoading: true,
        step: 3,
        message: 'Criando carteira digital...',
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStep({
        isLoading: true,
        step: 4,
        message: 'Registrando usuário na blockchain...',
      });
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Converter o CEP para número para o formato esperado pela API
      const apiData: UserRegisterParamsType = {
        ...data,
        address: {
          ...data.address,
          PostalCode: parseInt(data.address.PostalCode, 10),
        }
      };
      
      // Chamada real da API
      const response: AxiosResponse<UserRegisterResponse> = await apiRegister(apiData);
      
      setProcessingStep({
        isLoading: true,
        step: 5,
        message: 'Finalizando registro...',
      });
      
      toast.success(response.data.message, {
        description: 'Registro concluído com sucesso! Redirecionando...',
        duration: 5000,
      });
      
      setTimeout(() => {
        navigate('/');
      }, 4000);
    } catch (error) {
      console.error('Erro de registro:', error);
      toast.error('Falha no registro!', {
        description: 'Verifique seus dados e tente novamente.',
        duration: 5000,
      });
    } finally {
      setProcessingStep({
        isLoading: false,
        step: 0,
        message: '',
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-10xl bg-white shadow-lg rounded-xl p-8 space-y-6 border border-gray-100"
    >
      <Toaster position="top-right" closeButton duration={5000} />
      <h2 className="text-3xl font-bold text-start text-gray-800 mb-6 flex items-center">
        <User className="mr-2 h-8 w-8 text-blue-600" />
        Criar Nova Conta
      </h2>

      {/* Estado de Processamento */}
      {processingStep.isLoading && (
        <div className="mb-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processando seu registro
          </h3>
          <div className="mb-2">
            <Progress value={processingStep.step * 20} className="h-2" />
          </div>
          <p className="text-sm text-blue-700">{processingStep.message}</p>
        </div>
      )}

      {/* Campos de Registro - Primeira linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative">
            <Label
              htmlFor="email"
              className="text-gray-700 text-sm font-medium mb-1 flex items-center"
            >
              <Mail className="mr-1 h-4 w-4 text-gray-500" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...registerField('email')}
              className={`w-full pl-3 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition ${
                errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="seu.email@exemplo.com"
              disabled={processingStep.isLoading}
            />
            {errors.email && (
              <div className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="relative">
            <Label
              htmlFor="username"
              className="block text-gray-700 text-sm font-medium mb-1 flex items-center"
            >
              <User className="mr-1 h-4 w-4 text-gray-500" />
              Nome de Usuário
            </Label>
            <Input
              id="username"
              {...registerField('username')}
              className={`w-full pl-3 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition ${
                errors.username ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="seunome123"
              disabled={processingStep.isLoading}
            />
            {errors.username && (
              <div className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.username.message}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Label
              htmlFor="profileImageUrl"
              className="block text-gray-700 text-sm font-medium mb-1 flex items-center"
            >
              <User className="mr-1 h-4 w-4 text-gray-500" />
              URL da Imagem de Perfil (opcional)
            </Label>
            <Input
              id="profileImageUrl"
              {...registerField('profileImageUrl')}
              className={`w-full pl-3 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition ${
                errors.profileImageUrl ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="https://exemplo.com/imagem.jpg"
              disabled={processingStep.isLoading}
            />
            {errors.profileImageUrl && (
              <div className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.profileImageUrl.message}
              </div>
            )}
          </div>

          <div className="relative">
            <Label
              htmlFor="age"
              className="block text-gray-700 text-sm font-medium mb-1 flex items-center"
            >
              <User className="mr-1 h-4 w-4 text-gray-500" />
              Idade
            </Label>
            <Input
              id="age"
              type="number"
              {...registerField('age')}
              className={`w-full pl-3 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition ${
                errors.age ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Sua idade"
              min="18"
              disabled={processingStep.isLoading}
            />
            {errors.age && (
              <div className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.age.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campos de Senha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="space-y-4">
          <div className="relative">
            <Label
              htmlFor="password"
              className="block text-gray-700 text-sm font-medium mb-1 flex items-center"
            >
              <Lock className="mr-1 h-4 w-4 text-gray-500" />
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...registerField('password')}
                className={`w-full pl-3 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition ${
                  errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Crie uma senha forte"
                disabled={processingStep.isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="mb-1 text-xs flex justify-between">
                  <span>Força da senha:</span>
                  <span className={`font-medium ${
                    passwordStrength < 40 ? 'text-red-500' : 
                    passwordStrength < 80 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {passwordStrength < 40 ? 'Fraca' : 
                     passwordStrength < 80 ? 'Média' : 'Forte'}
                  </span>
                </div>
                <Progress 
                  value={passwordStrength} 
                  className={`h-1 ${getPasswordStrengthColor(passwordStrength)}`} 
                />
              </div>
            )}
            {errors.password && (
              <div className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.password.message}
              </div>
            )}
          </div>
          
          <div className="space-y-1 text-xs text-gray-500">
            <p className="flex items-center">
              {/[A-Z]/.test(password) ? 
                <Check className="h-3 w-3 mr-1 text-green-500" /> : 
                <AlertCircle className="h-3 w-3 mr-1 text-gray-400" />}
              Uma letra maiúscula
            </p>
            <p className="flex items-center">
              {/[a-z]/.test(password) ? 
                <Check className="h-3 w-3 mr-1 text-green-500" /> : 
                <AlertCircle className="h-3 w-3 mr-1 text-gray-400" />}
              Uma letra minúscula
            </p>
            <p className="flex items-center">
              {/[0-9]/.test(password) ? 
                <Check className="h-3 w-3 mr-1 text-green-500" /> : 
                <AlertCircle className="h-3 w-3 mr-1 text-gray-400" />}
              Um número
            </p>
            <p className="flex items-center">
              {/[^A-Za-z0-9]/.test(password) ? 
                <Check className="h-3 w-3 mr-1 text-green-500" /> : 
                <AlertCircle className="h-3 w-3 mr-1 text-gray-400" />}
              Um caractere especial
            </p>
            <p className="flex items-center">
              {password.length >= 8 ? 
                <Check className="h-3 w-3 mr-1 text-green-500" /> : 
                <AlertCircle className="h-3 w-3 mr-1 text-gray-400" />}
              Mínimo de 8 caracteres
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Label
              htmlFor="confirmPassword"
              className="block text-gray-700 text-sm font-medium mb-1 flex items-center"
            >
              <Lock className="mr-1 h-4 w-4 text-gray-500" />
              Confirmar Senha
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...registerField('confirmPassword')}
                className={`w-full pl-3 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition ${
                  errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirme sua senha"
                disabled={processingStep.isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.confirmPassword.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campos de Endereço */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
          <Home className="mr-2 h-5 w-5 text-blue-600" />
          Endereço
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <Label
              htmlFor="address.City"
              className="block text-gray-700 text-sm font-medium mb-1 flex items-center"
            >
              <MapPin className="mr-1 h-4 w-4 text-gray-500" />
              Cidade
            </Label>
            <Input
              id="address.City"
              {...registerField('address.City')}
              className={`w-full pl-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition ${
                errors.address?.City ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Sua cidade"
              disabled={processingStep.isLoading}
            />
            {errors.address?.City && (
              <div className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.address.City.message}
              </div>
            )}
          </div>

          <div className="relative">
            <Label
              htmlFor="address.Street"
              className="block text-gray-700 text-sm font-medium mb-1 flex items-center"
            >
              <MapPin className="mr-1 h-4 w-4 text-gray-500" />
              Rua
            </Label>
            <Input
              id="address.Street"
              {...registerField('address.Street')}
              className={`w-full pl-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition ${
                errors.address?.Street ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome da rua"
              disabled={processingStep.isLoading}
            />
            {errors.address?.Street && (
              <div className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.address.Street.message}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="relative">
            <Label
              htmlFor="address.PostalCode"
              className="block text-gray-700 text-sm font-medium mb-1 flex items-center"
            >
              <MapPin className="mr-1 h-4 w-4 text-gray-500" />
              CEP
            </Label>
            <Input
              id="address.PostalCode"
              {...registerField('address.PostalCode')}
              className={`w-full pl-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition ${
                errors.address?.PostalCode ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="00000-000"
              disabled={processingStep.isLoading}
            />
            {errors.address?.PostalCode && (
              <div className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.address.PostalCode.message}
              </div>
            )}
          </div>

          <div className="relative">
            <Label
              htmlFor="address.HouseNumber"
              className="block text-gray-700 text-sm font-medium mb-1 flex items-center"
            >
              <Home className="mr-1 h-4 w-4 text-gray-500" />
              Número
            </Label>
            <Input
              id="address.HouseNumber"
              {...registerField('address.HouseNumber')}
              className={`w-full pl-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition ${
                errors.address?.HouseNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Número"
              disabled={processingStep.isLoading}
            />
            {errors.address?.HouseNumber && (
              <div className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.address.HouseNumber.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end mt-8 space-x-4">
        <Button
          type="button"
          variant="outline"
          className="px-6 py-2 rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50 transition duration-200"
          disabled={processingStep.isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="default"
          className="px-6 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center gap-2 min-w-[120px] justify-center"
          disabled={processingStep.isLoading}
        >
          {processingStep.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Registrar
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

// Componente InputField não é mais necessário pois suas funcionalidades foram incorporadas diretamente no formulário
