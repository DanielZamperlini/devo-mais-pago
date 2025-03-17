import React, { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, CheckCircle, ChevronLeft, ChevronRight, Calendar, DollarSign, ClipboardList, AlertCircle } from 'lucide-react';

interface Debt {
  id: string;
  name: string;
  amount: number;
  installments: number;
  currentInstallment?: number;
  dueDate: string;
  isRecurring: boolean;
  isPaid: boolean;
  createdAt: string;
}

function App() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    installments: '1',
    dueDate: '',
    isRecurring: false
  });

  useEffect(() => {
    const savedDebts = localStorage.getItem('debts');
    if (savedDebts) {
      setDebts(JSON.parse(savedDebts));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('debts', JSON.stringify(debts));
  }, [debts]);

  const getCurrentMonth = () => {
    return selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getTotalMonthlyDebt = () => {
    return debts.reduce((total, debt) => {
      if (!debt.isPaid && isDebtDueThisMonth(debt)) {
        return total + debt.amount;
      }
      return total;
    }, 0);
  };

  const isDebtDueThisMonth = (debt: Debt) => {
    const dueDate = new Date(debt.dueDate);
    return selectedMonth.getMonth() === dueDate.getMonth() && 
           selectedMonth.getFullYear() === dueDate.getFullYear();
  };

  const isDebtOverdue = (debt: Debt) => {
    if (debt.isPaid) return false;
    const today = new Date();
    const dueDate = new Date(debt.dueDate);
    return today > dueDate;
  };

  const generateInstallments = (startDate: string, totalInstallments: number): Debt[] => {
    const installments: Debt[] = [];
    const baseDate = new Date(startDate);
    const installmentAmount = Number(formData.amount); // Use the full amount for each installment

    for (let i = 0; i < totalInstallments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(baseDate.getMonth() + i);

      installments.push({
        id: `${Date.now()}-${i}`,
        name: formData.name,
        amount: installmentAmount,
        installments: totalInstallments,
        currentInstallment: i + 1,
        dueDate: installmentDate.toISOString().split('T')[0],
        isRecurring: false,
        isPaid: false,
        createdAt: new Date().toISOString()
      });
    }

    return installments;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Number(formData.installments) > 1) {
      const installments = generateInstallments(formData.dueDate, Number(formData.installments));
      setDebts(prev => [...prev, ...installments]);
    } else {
      const newDebt: Debt = {
        id: editingDebt?.id || Date.now().toString(),
        name: formData.name,
        amount: Number(formData.amount),
        installments: Number(formData.installments),
        dueDate: formData.dueDate,
        isRecurring: formData.isRecurring,
        isPaid: false,
        createdAt: new Date().toISOString()
      };

      if (editingDebt) {
        setDebts(debts.map(debt => debt.id === editingDebt.id ? newDebt : debt));
      } else {
        setDebts([...debts, newDebt]);
      }
    }

    setIsModalOpen(false);
    setEditingDebt(null);
    setFormData({
      name: '',
      amount: '',
      installments: '1',
      dueDate: '',
      isRecurring: false
    });
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      amount: debt.amount.toString(),
      installments: debt.installments.toString(),
      dueDate: debt.dueDate,
      isRecurring: debt.isRecurring
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDebts(debts.filter(debt => debt.id !== id));
  };

  const togglePaid = (id: string) => {
    setDebts(debts.map(debt => 
      debt.id === id ? { ...debt, isPaid: !debt.isPaid } : debt
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Controle de Dívidas</h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all transform hover:scale-105"
            >
              <PlusCircle size={20} />
              <span>Nova Dívida</span>
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 sm:p-6 mb-8 text-white">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl sm:text-2xl font-semibold">{getCurrentMonth()}</h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6" />
              <p className="text-lg sm:text-xl">
                Total do mês: <span className="font-bold">
                  R$ {getTotalMonthlyDebt().toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {debts.filter(isDebtDueThisMonth).map(debt => (
              <div
                key={debt.id}
                className={`p-4 sm:p-6 rounded-xl border transition-all transform hover:scale-[1.02] ${
                  debt.isPaid
                    ? 'bg-green-50 border-green-200'
                    : isDebtOverdue(debt)
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-lg flex flex-wrap items-center gap-2">
                      {debt.name}
                      {debt.currentInstallment && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {debt.currentInstallment}ª parcela de {debt.installments}
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 flex items-center gap-2 mt-1">
                      <DollarSign size={16} />
                      R$ {debt.amount.toFixed(2)} {debt.isRecurring && '(Recorrente)'}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Calendar size={16} />
                      Vencimento: {new Date(debt.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => togglePaid(debt.id)}
                      className={`p-2 rounded-full ${
                        debt.isPaid ? 'text-green-600 bg-green-100' : 'text-gray-400 bg-gray-100'
                      } hover:bg-opacity-80 transition-colors`}
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      onClick={() => handleEdit(debt)}
                      className="p-2 rounded-full text-blue-600 bg-blue-100 hover:bg-opacity-80 transition-colors"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(debt.id)}
                      className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-opacity-80 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {debts.filter(isDebtDueThisMonth).length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhuma dívida encontrada para este mês</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <PlusCircle className="text-blue-600" />
              {editingDebt ? 'Editar Dívida' : 'Nova Dívida'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Dívida</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  placeholder="Ex: Cartão de Crédito"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    placeholder="0,00"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                  <input
                    type="number"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    placeholder="Número de parcelas"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center bg-gray-50 p-4 rounded-xl">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isRecurring" className="ml-3 block text-sm text-gray-700">
                  Cobrança Recorrente
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingDebt(null);
                    setFormData({
                      name: '',
                      amount: '',
                      installments: '1',
                      dueDate: '',
                      isRecurring: false
                    });
                  }}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {editingDebt ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;