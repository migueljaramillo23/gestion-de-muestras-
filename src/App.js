import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Package, Palette, TrendingUp, Download, FileSpreadsheet, Moon, Sun, Filter, Edit2, Trash2, Search, Bell } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';

const ColorSampleTracker = () => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profiles, setProfiles] = useState(['Perfil 1', 'Admin']);
  const [newProfileName, setNewProfileName] = useState('');
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteSurveyModal, setShowDeleteSurveyModal] = useState(false);
  const [surveyToEdit, setSurveyToEdit] = useState(null);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState({
    domiciliario: '',
    colorista: '',
    color: '',
    cliente: ''
  });
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Estados para gestión de clientes
  const [showClientManagement, setShowClientManagement] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [showClientDashboard, setShowClientDashboard] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [clientFormData, setClientFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: ''
  });
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [reportConfig, setReportConfig] = useState({
    period: 'week',
    startDate: '',
    endDate: ''
  });
  
  const [formData, setFormData] = useState({
    domiciliario: '',
    cliente: '',
    color: '',
    colorista: '',
    fecha: new Date().toISOString()
  });
  
  const [surveys, setSurveys] = useState([]);

  // Cargar datos de Firebase en tiempo real
  useEffect(() => {
    const surveysRef = collection(db, 'surveys');
    const q = query(surveysRef, orderBy('fecha', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const surveysData = [];
      snapshot.forEach((docSnap) => {
        surveysData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSurveys(surveysData);
      setLoading(false);
    }, (error) => {
      console.error('Error al cargar:', error);
      alert('Error al conectar con Firebase. Verifica tu conexión.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Cargar clientes de Firebase en tiempo real
  useEffect(() => {
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, orderBy('nombre', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = [];
      snapshot.forEach((docSnap) => {
        clientsData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setClients(clientsData);
    }, (error) => {
      console.error('Error al cargar clientes:', error);
    });

    return () => unsubscribe();
  }, []);

  // Cargar configuraciones locales
  useEffect(() => {
    const savedProfiles = localStorage.getItem('profiles');
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedAdminPassword = localStorage.getItem('adminPassword');
    
    if (savedProfiles) setProfiles(JSON.parse(savedProfiles));
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
    if (savedAdminPassword) setAdminPassword(savedAdminPassword);
  }, []);

  useEffect(() => {
    localStorage.setItem('profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (currentProfile === 'Admin' && surveys.length > 0) {
      generateNotifications();
    }
  }, [surveys, currentProfile]);

  const generateNotifications = () => {
    const newNotifications = [];
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const coloristaCount = {};
    surveys.forEach(s => {
      coloristaCount[s.colorista] = (coloristaCount[s.colorista] || 0) + 1;
    });
    
    Object.entries(coloristaCount).forEach(([colorista, count]) => {
      if (count > 5) {
        newNotifications.push({
          type: 'warning',
          message: `${colorista} tiene ${count} muestras acumuladas`,
          icon: '⚠️'
        });
      }
    });
    
    const domiciliarios = ['CURA', 'VILLADA', 'FRANSUA'];
    domiciliarios.forEach(dom => {
      const recentDeliveries = surveys.filter(s => 
        s.domiciliario === dom && new Date(s.fecha) >= threeDaysAgo
      );
      if (recentDeliveries.length === 0) {
        const lastDelivery = surveys
          .filter(s => s.domiciliario === dom)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
        
        if (lastDelivery) {
          const daysSince = Math.floor((now - new Date(lastDelivery.fecha)) / (1000 * 60 * 60 * 24));
          newNotifications.push({
            type: 'info',
            message: `${dom} no ha hecho entregas en ${daysSince} días`,
            icon: '📦'
          });
        }
      }
    });
    
    setNotifications(newNotifications);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si es el campo de cliente, actualizar y mostrar sugerencias
    if (name === 'cliente') {
      setFormData({
        ...formData,
        [name]: value
      });
      setClientSearchTerm(value);
      setShowClientSuggestions(value.length > 0);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const selectClient = (clientName) => {
    setFormData({
      ...formData,
      cliente: clientName
    });
    setClientSearchTerm(clientName);
    setShowClientSuggestions(false);
  };

  const handleClientFormChange = (e) => {
    setClientFormData({
      ...clientFormData,
      [e.target.name]: e.target.value
    });
  };

  const addClient = async () => {
    if (!clientFormData.nombre.trim()) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    // Verificar si el cliente ya existe
    const existingClient = clients.find(c => 
      c.nombre.toLowerCase() === clientFormData.nombre.trim().toLowerCase()
    );
    
    if (existingClient) {
      alert('Ya existe un cliente con ese nombre');
      return;
    }

    try {
      await addDoc(collection(db, 'clients'), {
        nombre: clientFormData.nombre.trim(),
        telefono: clientFormData.telefono.trim(),
        email: clientFormData.email.trim(),
        direccion: clientFormData.direccion.trim(),
        notas: clientFormData.notas.trim(),
        createdAt: new Date().toISOString()
      });
      
      setClientFormData({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        notas: ''
      });
      setShowAddClientModal(false);
      alert('✅ Cliente agregado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al agregar cliente');
    }
  };

  const openEditClientModal = (client) => {
    setClientToEdit(client);
    setClientFormData({
      nombre: client.nombre,
      telefono: client.telefono || '',
      email: client.email || '',
      direccion: client.direccion || '',
      notas: client.notas || ''
    });
    setShowEditClientModal(true);
  };

  const saveEditedClient = async () => {
    if (!clientFormData.nombre.trim()) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    try {
      const clientRef = doc(db, 'clients', clientToEdit.id);
      await updateDoc(clientRef, {
        nombre: clientFormData.nombre.trim(),
        telefono: clientFormData.telefono.trim(),
        email: clientFormData.email.trim(),
        direccion: clientFormData.direccion.trim(),
        notas: clientFormData.notas.trim(),
        updatedAt: new Date().toISOString()
      });
      
      setShowEditClientModal(false);
      setClientToEdit(null);
      setClientFormData({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        notas: ''
      });
      alert('✅ Cliente actualizado');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al actualizar cliente');
    }
  };

  const openDeleteClientModal = (client) => {
    setClientToDelete(client);
    setShowDeleteClientModal(true);
  };

  const deleteClient = async () => {
    try {
      await deleteDoc(doc(db, 'clients', clientToDelete.id));
      setShowDeleteClientModal(false);
      setClientToDelete(null);
      alert('✅ Cliente eliminado');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al eliminar cliente');
    }
  };

  const getClientHistory = (clientName) => {
    return surveys.filter(s => s.cliente.toLowerCase() === clientName.toLowerCase());
  };

  const openClientDashboard = (client) => {
    setSelectedClient(client);
    setShowClientDashboard(true);
  };

  const getClientAnalytics = (clientName) => {
    const clientSurveys = getClientHistory(clientName);
    
    if (clientSurveys.length === 0) return null;

    const colorCount = {};
    const coloristaCount = {};
    const domiciliarioCount = {};
    const monthlyData = {};

    clientSurveys.forEach(s => {
      // Contar colores
      colorCount[s.color] = (colorCount[s.color] || 0) + 1;
      
      // Contar coloristas
      coloristaCount[s.colorista] = (coloristaCount[s.colorista] || 0) + 1;
      
      // Contar domiciliarios
      domiciliarioCount[s.domiciliario] = (domiciliarioCount[s.domiciliario] || 0) + 1;
      
      // Agrupar por mes
      const date = new Date(s.fecha);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    // Convertir datos mensuales a array ordenado
    const monthlyArray = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({
        mes: month,
        muestras: count
      }));

    return {
      totalMuestras: clientSurveys.length,
      colorMasSolicitado: Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0],
      coloristaMasUsado: Object.entries(coloristaCount).sort((a, b) => b[1] - a[1])[0],
      domiciliarioMasUsado: Object.entries(domiciliarioCount).sort((a, b) => b[1] - a[1])[0],
      colorData: Object.entries(colorCount).map(([name, value]) => ({ name, value })),
      coloristaData: Object.entries(coloristaCount).map(([name, value]) => ({ name, value })),
      monthlyData: monthlyArray,
      primeraVisita: clientSurveys[clientSurveys.length - 1]?.fecha,
      ultimaVisita: clientSurveys[0]?.fecha
    };
  };

  const filteredClients = clients.filter(client =>
    client.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    (client.telefono && client.telefono.includes(clientSearchTerm)) ||
    (client.email && client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );

  const handleEditInputChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    // Validación más estricta
    if (!formData.domiciliario || !formData.cliente || !formData.color || !formData.colorista) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    // Validar que el cliente no sea solo espacios o caracteres especiales
    const clienteTrimmed = formData.cliente.trim();
    if (clienteTrimmed.length === 0 || clienteTrimmed === '•' || clienteTrimmed === '-') {
      alert('Por favor ingresa un nombre de cliente válido');
      return;
    }
    
    // Validar que el color no sea solo espacios o caracteres especiales
    const colorTrimmed = formData.color.trim();
    if (colorTrimmed.length === 0 || colorTrimmed === '•' || colorTrimmed === '-') {
      alert('Por favor ingresa un color válido');
      return;
    }
    
    try {
      const newSurvey = {
        ...formData,
        cliente: clienteTrimmed,
        color: colorTrimmed,
        perfil: currentProfile,
        fecha: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'surveys'), newSurvey);
      
      setFormData({
        domiciliario: '',
        cliente: '',
        color: '',
        colorista: '',
        fecha: new Date().toISOString()
      });
      alert('✅ Encuesta guardada en Firebase');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al guardar');
    }
  };

  const openEditModal = (survey) => {
    setSurveyToEdit(survey);
    setEditFormData({...survey});
    setShowEditModal(true);
  };

  const saveEditedSurvey = async () => {
    if (!editFormData.domiciliario || !editFormData.cliente || !editFormData.color || !editFormData.colorista) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      const surveyRef = doc(db, 'surveys', surveyToEdit.id);
      await updateDoc(surveyRef, {
        domiciliario: editFormData.domiciliario,
        cliente: editFormData.cliente,
        color: editFormData.color,
        colorista: editFormData.colorista
      });
      
      setShowEditModal(false);
      setSurveyToEdit(null);
      alert('✅ Actualizado');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al actualizar');
    }
  };

  const openDeleteSurveyModal = (survey) => {
    setSurveyToDelete(survey);
    setShowDeleteSurveyModal(true);
  };

  const deleteSurvey = async () => {
    try {
      await deleteDoc(doc(db, 'surveys', surveyToDelete.id));
      setShowDeleteSurveyModal(false);
      setSurveyToDelete(null);
      alert('✅ Eliminado');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error');
    }
  };

  const addNewProfile = () => {
    if (newProfileName.trim() && !profiles.includes(newProfileName.trim())) {
      setProfiles([...profiles, newProfileName.trim()]);
      setNewProfileName('');
      setShowNewProfileForm(false);
      alert('Perfil creado');
    }
  };

  const handleProfileSelection = (profile) => {
    if (profile === 'Admin') {
      const savedPassword = localStorage.getItem('adminPassword');
      if (!savedPassword) {
        setShowSetPasswordModal(true);
      } else {
        setShowPasswordModal(true);
      }
    } else {
      setCurrentProfile(profile);
    }
  };

  const saveNewPassword = () => {
    if (!newPasswordInput.trim()) {
      alert('La contraseña no puede estar vacía');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      alert('Las contraseñas no coinciden');
      return;
    }
    localStorage.setItem('adminPassword', newPasswordInput.trim());
    setAdminPassword(newPasswordInput.trim());
    setCurrentProfile('Admin');
    setShowSetPasswordModal(false);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  const validateAdminPassword = () => {
    const savedPassword = localStorage.getItem('adminPassword');
    if (passwordInput === savedPassword) {
      setCurrentProfile('Admin');
      setShowPasswordModal(false);
      setPasswordInput('');
    } else {
      alert('Contraseña incorrecta');
      setPasswordInput('');
    }
  };

  const deleteProfile = () => {
    if (profileToDelete && profileToDelete !== 'Admin') {
      const updatedProfiles = profiles.filter(p => p !== profileToDelete);
      setProfiles(updatedProfiles);
      setShowDeleteProfileModal(false);
      setProfileToDelete(null);
      alert('Perfil eliminado');
    }
  };

  const getFilteredSurveys = () => {
    let filtered = surveys;
    
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter(survey => {
        const surveyDate = new Date(survey.fecha);
        const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
        
        if (start && end) {
          return surveyDate >= start && surveyDate <= end;
        } else if (start) {
          return surveyDate >= start;
        } else if (end) {
          return surveyDate <= end;
        }
        return true;
      });
    }
    
    if (filterBy.domiciliario) filtered = filtered.filter(s => s.domiciliario === filterBy.domiciliario);
    if (filterBy.colorista) filtered = filtered.filter(s => s.colorista === filterBy.colorista);
    if (filterBy.color) filtered = filtered.filter(s => s.color.toLowerCase().includes(filterBy.color.toLowerCase()));
    if (filterBy.cliente) filtered = filtered.filter(s => s.cliente.toLowerCase().includes(filterBy.cliente.toLowerCase()));
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.domiciliario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.colorista.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getReportSurveys = () => {
    const now = new Date();
    let startDate = new Date();
    
    if (reportConfig.startDate && reportConfig.endDate) {
      return surveys.filter(s => {
        const date = new Date(s.fecha);
        return date >= new Date(reportConfig.startDate) && date <= new Date(reportConfig.endDate);
      });
    }
    
    switch(reportConfig.period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        break;
    }
    
    return surveys.filter(s => new Date(s.fecha) >= startDate);
  };

  const getTrendData = () => {
    const last30Days = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = surveys.filter(s => {
        const sDate = new Date(s.fecha);
        return sDate >= date && sDate < nextDate;
      }).length;
      
      last30Days.push({
        fecha: `${date.getDate()}/${date.getMonth() + 1}`,
        muestras: count
      });
    }
    
    return last30Days;
  };

  const exportToExcel = () => {
    const filteredSurveys = getFilteredSurveys();
    if (filteredSurveys.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    let csv = 'Fecha,Perfil,Domiciliario,Cliente,Color,Colorista\n';
    filteredSurveys.forEach(survey => {
      const date = new Date(survey.fecha).toLocaleString();
      csv += `"${date}","${survey.perfil}","${survey.domiciliario}","${survey.cliente}","${survey.color}","${survey.colorista}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `muestras_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const generatePDFReport = () => {
    const reportSurveys = getReportSurveys();
    const analytics = getAnalytics(reportSurveys);
    
    if (!analytics) {
      alert('No hay datos');
      return;
    }

    const periodNames = { day: 'Hoy', week: 'Última Semana', month: 'Último Mes', year: 'Último Año' };

    let reportHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;padding:40px}h1{color:#8b5cf6;text-align:center}h2{color:#6366f1;margin-top:30px}.metric{background:#f3f4f6;padding:20px;margin:10px 0;border-radius:8px}.metric-title{font-weight:bold;color:#6b7280}.metric-value{font-size:24px;font-weight:bold;color:#1f2937}.footer{margin-top:40px;text-align:center;color:#6b7280}</style></head><body><h1>Informe de Muestras</h1><p style="text-align:center;color:#6b7280">Período: ${reportConfig.startDate && reportConfig.endDate ? `${new Date(reportConfig.startDate).toLocaleDateString()} - ${new Date(reportConfig.endDate).toLocaleDateString()}` : periodNames[reportConfig.period]}</p><h2>Resumen</h2><div class="metric"><div class="metric-title">Total</div><div class="metric-value">${reportSurveys.length}</div></div><div class="metric"><div class="metric-title">Top Colorista</div><div class="metric-value">${analytics.coloristaTop[0]}</div><div>${analytics.coloristaTop[1]} muestras</div></div><div class="metric"><div class="metric-title">Color Más Solicitado</div><div class="metric-value">${analytics.colorMasDeseado[0]}</div><div>${analytics.colorMasDeseado[1]} veces</div></div><div class="footer"><p>Generado ${new Date().toLocaleString()}</p><p>🔥 Firebase</p></div></body></html>`;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `informe_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
  };

  const deleteAllData = async () => {
    try {
      const batch = surveys.map(survey => deleteDoc(doc(db, 'surveys', survey.id)));
      await Promise.all(batch);
      setShowDeleteModal(false);
      alert('✅ Datos eliminados');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error');
    }
  };

  const getAnalytics = (surveyData = null) => {
    const data = surveyData || getFilteredSurveys();
    if (data.length === 0) return null;

    const colorCount = {};
    const domiciliarioCount = {};
    const coloristaCount = {};
    const clienteCount = {};

    data.forEach(s => {
      colorCount[s.color] = (colorCount[s.color] || 0) + 1;
      domiciliarioCount[s.domiciliario] = (domiciliarioCount[s.domiciliario] || 0) + 1;
      coloristaCount[s.colorista] = (coloristaCount[s.colorista] || 0) + 1;
      clienteCount[s.cliente] = (clienteCount[s.cliente] || 0) + 1;
    });

    return {
      colorMasDeseado: Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0],
      domiciliarioTop: Object.entries(domiciliarioCount).sort((a, b) => b[1] - a[1])[0],
      coloristaTop: Object.entries(coloristaCount).sort((a, b) => b[1] - a[1])[0],
      clienteTop: Object.entries(clienteCount).sort((a, b) => b[1] - a[1])[0],
      colorData: Object.entries(colorCount).map(([name, value]) => ({ name, value })),
      domiciliarioData: Object.entries(domiciliarioCount).map(([name, value]) => ({ name, value })),
      coloristaData: Object.entries(coloristaCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      clienteData: Object.entries(clienteCount).map(([name, value]) => ({ name, value }))
    };
  };

  const analytics = getAnalytics();
  const trendData = getTrendData();
  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-600 to-blue-600';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-800';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className={`${cardBg} rounded-2xl shadow-2xl p-8`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className={`${textPrimary} text-xl`}>Cargando desde Firebase...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className={`${cardBg} rounded-2xl shadow-2xl p-8 max-w-md w-full`}>
          <div className="flex justify-end mb-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-gray-200">
              {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-600" />}
            </button>
          </div>
          
          <div className="text-center mb-8">
            <Palette className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h1 className={`text-3xl font-bold ${textPrimary} mb-2`}>Sistema de Muestras</h1>
            <p className={textSecondary}>Selecciona tu perfil</p>
            <p className="text-green-500 text-sm mt-2">🔥 Conectado a Firebase</p>
          </div>
          
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div key={profile} className="flex gap-2">
                <button
                  onClick={() => handleProfileSelection(profile)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  {profile}
                </button>
                {profile !== 'Admin' && (
                  <button
                    onClick={() => {
                      setProfileToDelete(profile);
                      setShowDeleteProfileModal(true);
                    }}
                    className="bg-red-500 text-white px-4 rounded-xl hover:bg-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {!showNewProfileForm ? (
            <button
              onClick={() => setShowNewProfileForm(true)}
              className={`w-full mt-4 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} py-3 rounded-xl font-semibold hover:bg-gray-300`}
            >
              + Crear Nuevo Perfil
            </button>
          ) : (
            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Nombre del perfil"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none ${inputBg}`}
              />
              <div className="flex gap-2">
                <button onClick={addNewProfile} className="flex-1 bg-green-500 text-white py-2 rounded-xl hover:bg-green-600">
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setShowNewProfileForm(false);
                    setNewProfileName('');
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-xl hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full`}>
              <h3 className={`text-2xl font-bold ${textPrimary} mb-4`}>🔒 Acceso Admin</h3>
              <p className={`${textSecondary} mb-6`}>Ingresa la contraseña</p>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && validateAdminPassword()}
                placeholder="Contraseña"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none mb-4 ${inputBg}`}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={validateAdminPassword} className="flex-1 bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600">
                  Ingresar
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showSetPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full`}>
              <h3 className={`text-2xl font-bold ${textPrimary} mb-4`}>🔐 Configurar Contraseña</h3>
              <p className={`${textSecondary} mb-6`}>Crea una contraseña de administrador</p>
              <input
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Nueva contraseña"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none mb-3 ${inputBg}`}
                autoFocus
              />
              <input
                type="password"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveNewPassword()}
                placeholder="Confirmar contraseña"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none mb-4 ${inputBg}`}
              />
              <div className="flex gap-2">
                <button onClick={saveNewPassword} className="flex-1 bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600">
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setShowSetPasswordModal(false);
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full`}>
              <h3 className="text-2xl font-bold text-red-600 mb-4">⚠️ Eliminar Perfil</h3>
              <p className={`${textPrimary} mb-6`}>¿Eliminar "{profileToDelete}"?</p>
              <div className="flex gap-2">
                <button onClick={deleteProfile} className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700">
                  Sí, Eliminar
                </button>
                <button
                  onClick={() => {
                    setShowDeleteProfileModal(false);
                    setProfileToDelete(null);
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentProfile !== 'Admin') {
    return (
      <div className={`min-h-screen ${bgClass} p-4`}>
        <div className="max-w-2xl mx-auto">
          <div className={`${cardBg} rounded-2xl shadow-2xl p-8`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${textPrimary}`}>Registro de Muestra</h2>
              <div className="flex gap-2">
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-gray-200">
                  {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-600" />}
                </button>
                <button
                  onClick={() => setCurrentProfile(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all"
                >
                  Salir
                </button>
              </div>
            </div>

            <div className={`mb-6 ${darkMode ? 'bg-purple-900' : 'bg-purple-100'} p-4 rounded-lg`}>
              <p className={`${darkMode ? 'text-purple-200' : 'text-purple-800'} font-semibold`}>Perfil activo: {currentProfile}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block ${textPrimary} font-semibold mb-2`}>
                  1. ¿Quién es el domiciliario?
                </label>
                <select
                  name="domiciliario"
                  value={formData.domiciliario}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none ${inputBg}`}
                >
                  <option value="">Selecciona un domiciliario</option>
                  <option value="CURA">CURA</option>
                  <option value="VILLADA">VILLADA</option>
                  <option value="FRANSUA">FRANSUA</option>
                </select>
              </div>

              <div>
                <label className={`block ${textPrimary} font-semibold mb-2`}>
                  2. ¿De quién es la muestra que se trajo?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    onFocus={() => setShowClientSuggestions(formData.cliente.length > 0)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="Nombre del cliente"
                    autoComplete="off"
                  />
                  {showClientSuggestions && clients.length > 0 && (
                    <div className={`absolute z-10 w-full mt-1 ${cardBg} border-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'} rounded-xl shadow-lg max-h-48 overflow-y-auto`}>
                      {clients
                        .filter(client => client.nombre.toLowerCase().includes(formData.cliente.toLowerCase()))
                        .slice(0, 5)
                        .map(client => (
                          <div
                            key={client.id}
                            onClick={() => selectClient(client.nombre)}
                            className={`px-4 py-3 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} last:border-b-0`}
                          >
                            <p className={`font-medium ${textPrimary}`}>{client.nombre}</p>
                            {client.telefono && (
                              <p className={`text-sm ${textSecondary}`}>📞 {client.telefono}</p>
                            )}
                          </div>
                        ))}
                      {clients.filter(client => client.nombre.toLowerCase().includes(formData.cliente.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3">
                          <p className={`text-sm ${textSecondary}`}>No se encontraron clientes</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={`block ${textPrimary} font-semibold mb-2`}>
                  3. ¿Qué color es?
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none ${inputBg}`}
                  placeholder="Color de la muestra"
                />
              </div>

              <div>
                <label className={`block ${textPrimary} font-semibold mb-2`}>
                  4. ¿A qué colorista se la va a pasar?
                </label>
                <select
                  name="colorista"
                  value={formData.colorista}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none ${inputBg}`}
                >
                  <option value="">Selecciona un colorista</option>
                  <option value="ROBIN">ROBIN</option>
                  <option value="TAVO">TAVO</option>
                  <option value="VLADIMIR">VLADIMIR</option>
                </select>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Guardar Registro
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista Admin - CONTINÚA EN EL SIGUIENTE MENSAJE...
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} p-4`}>
      <div className="max-w-7xl mx-auto">
        <div className={`${cardBg} rounded-2xl shadow-lg p-6 mb-6`}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className={`text-3xl font-bold ${textPrimary}`}>Panel de Administración</h1>
            <div className="flex gap-2 flex-wrap">
              {notifications.length > 0 && (
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all flex items-center gap-2 relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {notifications.length}
                  </span>
                </button>
              )}
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-600" />}
              </button>
              <button
                onClick={() => setShowClientManagement(!showClientManagement)}
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-all flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Clientes
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filtros
              </button>
              <button
                onClick={exportToExcel}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Excel
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Informe
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <Package className="w-5 h-5" />
                Borrar Todo
              </button>
              <button
                onClick={() => setCurrentProfile(null)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {showNotifications && notifications.length > 0 && (
          <div className={`${cardBg} rounded-2xl shadow-lg p-6 mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${textPrimary}`}>🔔 Notificaciones</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className={`${textSecondary} hover:${textPrimary}`}
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${notif.type === 'warning' ? 'bg-yellow-100 border-l-4 border-yellow-500' : 'bg-blue-100 border-l-4 border-blue-500'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{notif.icon}</span>
                    <p className={`${notif.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'} font-medium`}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panel de Gestión de Clientes */}
        {showClientManagement && (
          <div className={`${cardBg} rounded-2xl shadow-lg p-6 mb-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${textPrimary}`}>👥 Gestión de Clientes</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddClientModal(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  Agregar Cliente
                </button>
                <button
                  onClick={() => setShowClientManagement(false)}
                  className={`${textSecondary} hover:${textPrimary} px-3`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Buscador de clientes */}
            <div className="mb-4">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${textSecondary}`} />
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre, teléfono o email..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none ${inputBg}`}
                />
              </div>
            </div>

            {/* Lista de clientes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <Users className={`w-16 h-16 mx-auto mb-3 ${textSecondary}`} />
                  <p className={`${textSecondary} text-lg`}>
                    {clientSearchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                  </p>
                </div>
              ) : (
                filteredClients.map(client => {
                  const history = getClientHistory(client.nombre);
                  return (
                    <div key={client.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 border-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className={`text-lg font-bold ${textPrimary}`}>{client.nombre}</h4>
                          <p className={`text-sm ${textSecondary}`}>
                            {history.length} muestra{history.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openClientDashboard(client)}
                            className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 transition-all"
                            title="Ver Dashboard"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditClientModal(client)}
                            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteClientModal(client)}
                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {client.telefono && (
                        <p className={`text-sm ${textSecondary} mb-1`}>
                          📞 {client.telefono}
                        </p>
                      )}
                      {client.email && (
                        <p className={`text-sm ${textSecondary} mb-1`}>
                          ✉️ {client.email}
                        </p>
                      )}
                      {client.direccion && (
                        <p className={`text-sm ${textSecondary} mb-1`}>
                          📍 {client.direccion}
                        </p>
                      )}
                      {client.notas && (
                        <p className={`text-sm ${textSecondary} italic mt-2 pt-2 border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                          💬 {client.notas}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className={`${cardBg} rounded-2xl shadow-lg p-6 mb-6`}>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none ${inputBg}`}
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="bg-gray-500 text-white px-4 py-3 rounded-xl hover:bg-gray-600 transition-all"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className={`${cardBg} rounded-2xl shadow-lg p-6 mb-6`}>
            <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>Filtros Avanzados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className={`block ${textSecondary} mb-2 text-sm`}>Domiciliario</label>
                <select
                  value={filterBy.domiciliario}
                  onChange={(e) => setFilterBy({...filterBy, domiciliario: e.target.value})}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                >
                  <option value="">Todos</option>
                  <option value="CURA">CURA</option>
                  <option value="VILLADA">VILLADA</option>
                  <option value="FRANSUA">FRANSUA</option>
                </select>
              </div>
              <div>
                <label className={`block ${textSecondary} mb-2 text-sm`}>Colorista</label>
                <select
                  value={filterBy.colorista}
                  onChange={(e) => setFilterBy({...filterBy, colorista: e.target.value})}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                >
                  <option value="">Todos</option>
                  <option value="ROBIN">ROBIN</option>
                  <option value="TAVO">TAVO</option>
                  <option value="VLADIMIR">VLADIMIR</option>
                </select>
              </div>
              <div>
                <label className={`block ${textSecondary} mb-2 text-sm`}>Color</label>
                <input
                  type="text"
                  placeholder="Buscar color..."
                  value={filterBy.color}
                  onChange={(e) => setFilterBy({...filterBy, color: e.target.value})}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                />
              </div>
              <div>
                <label className={`block ${textSecondary} mb-2 text-sm`}>Cliente</label>
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={filterBy.cliente}
                  onChange={(e) => setFilterBy({...filterBy, cliente: e.target.value})}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block ${textSecondary} mb-2 text-sm`}>Fecha Inicio</label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                />
              </div>
              <div>
                <label className={`block ${textSecondary} mb-2 text-sm`}>Fecha Fin</label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                />
              </div>
            </div>
            <button
              onClick={() => {
                setDateFilter({startDate: '', endDate: ''});
                setFilterBy({domiciliario: '', colorista: '', color: '', cliente: ''});
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Limpiar Todos los Filtros
            </button>
          </div>
        )}

        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full`}>
              <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>Generar Informe</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Período</label>
                  <select
                    value={reportConfig.period}
                    onChange={(e) => setReportConfig({...reportConfig, period: e.target.value})}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                  >
                    <option value="day">Hoy</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mes</option>
                    <option value="year">Último Año</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block ${textSecondary} mb-2`}>O selecciona fechas personalizadas:</label>
                  <input
                    type="date"
                    value={reportConfig.startDate}
                    onChange={(e) => setReportConfig({...reportConfig, startDate: e.target.value})}
                    className={`w-full px-4 py-2 mb-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                  />
                  <input
                    type="date"
                    value={reportConfig.endDate}
                    onChange={(e) => setReportConfig({...reportConfig, endDate: e.target.value})}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    generatePDFReport();
                    setShowReportModal(false);
                  }}
                  className="flex-1 bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-all font-semibold"
                >
                  Descargar PDF
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full`}>
              <h3 className={`text-2xl font-bold text-red-600 mb-4`}>⚠️ Confirmar Eliminación</h3>
              <p className={`${textPrimary} mb-6`}>
                ¿Eliminar TODOS los datos? Esta acción no se puede deshacer.
              </p>
              <p className={`${textSecondary} mb-6 text-sm`}>
                Se eliminarán <strong>{surveys.length}</strong> registros.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={deleteAllData}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-all font-semibold"
                >
                  Sí, Eliminar Todo
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && surveyToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full`}>
              <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>✏️ Editar Registro</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Domiciliario</label>
                  <select
                    name="domiciliario"
                    value={editFormData.domiciliario}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                  >
                    <option value="CURA">CURA</option>
                    <option value="VILLADA">VILLADA</option>
                    <option value="FRANSUA">FRANSUA</option>
                  </select>
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Cliente</label>
                  <input
                    type="text"
                    name="cliente"
                    value={editFormData.cliente}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Color</label>
                  <input
                    type="text"
                    name="color"
                    value={editFormData.color}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Colorista</label>
                  <select
                    name="colorista"
                    value={editFormData.colorista}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                  >
                    <option value="ROBIN">ROBIN</option>
                    <option value="TAVO">TAVO</option>
                    <option value="VLADIMIR">VLADIMIR</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={saveEditedSurvey}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-all font-semibold"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSurveyToEdit(null);
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteSurveyModal && surveyToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full`}>
              <h3 className={`text-2xl font-bold text-red-600 mb-4`}>🗑️ Eliminar Registro</h3>
              <p className={`${textPrimary} mb-4`}>
                ¿Eliminar este registro?
              </p>
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg mb-6`}>
                <p className={`${textSecondary} text-sm`}><strong>Domiciliario:</strong> {surveyToDelete.domiciliario}</p>
                <p className={`${textSecondary} text-sm`}><strong>Cliente:</strong> {surveyToDelete.cliente}</p>
                <p className={`${textSecondary} text-sm`}><strong>Color:</strong> {surveyToDelete.color}</p>
                <p className={`${textSecondary} text-sm`}><strong>Colorista:</strong> {surveyToDelete.colorista}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={deleteSurvey}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-all font-semibold"
                >
                  Sí, Eliminar
                </button>
                <button
                  onClick={() => {
                    setShowDeleteSurveyModal(false);
                    setSurveyToDelete(null);
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Agregar Cliente */}
        {showAddClientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto`}>
              <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>➕ Agregar Cliente</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block ${textSecondary} mb-2 font-semibold`}>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={clientFormData.nombre}
                    onChange={handleClientFormChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="Nombre completo del cliente"
                    autoFocus
                  />
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={clientFormData.telefono}
                    onChange={handleClientFormChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="Número de teléfono"
                  />
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={clientFormData.email}
                    onChange={handleClientFormChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={clientFormData.direccion}
                    onChange={handleClientFormChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="Dirección completa"
                  />
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Notas</label>
                  <textarea
                    name="notas"
                    value={clientFormData.notas}
                    onChange={handleClientFormChange}
                    rows="3"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="Notas adicionales sobre el cliente..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={addClient}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-all font-semibold"
                >
                  Agregar Cliente
                </button>
                <button
                  onClick={() => {
                    setShowAddClientModal(false);
                    setClientFormData({
                      nombre: '',
                      telefono: '',
                      email: '',
                      direccion: '',
                      notas: ''
                    });
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Cliente */}
        {showEditClientModal && clientToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto`}>
              <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>✏️ Editar Cliente</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block ${textSecondary} mb-2 font-semibold`}>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={clientFormData.nombre}
                    onChange={handleClientFormChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="Nombre completo del cliente"
                  />
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={clientFormData.telefono}
                    onChange={handleClientFormChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="Número de teléfono"
                  />
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={clientFormData.email}
                    onChange={handleClientFormChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={clientFormData.direccion}
                    onChange={handleClientFormChange}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="Dirección completa"
                  />
                </div>
                <div>
                  <label className={`block ${textSecondary} mb-2`}>Notas</label>
                  <textarea
                    name="notas"
                    value={clientFormData.notas}
                    onChange={handleClientFormChange}
                    rows="3"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${inputBg}`}
                    placeholder="Notas adicionales sobre el cliente..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={saveEditedClient}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-all font-semibold"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => {
                    setShowEditClientModal(false);
                    setClientToEdit(null);
                    setClientFormData({
                      nombre: '',
                      telefono: '',
                      email: '',
                      direccion: '',
                      notas: ''
                    });
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Eliminar Cliente */}
        {showDeleteClientModal && clientToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full`}>
              <h3 className={`text-2xl font-bold text-red-600 mb-4`}>⚠️ Eliminar Cliente</h3>
              <p className={`${textPrimary} mb-4`}>
                ¿Estás seguro de que deseas eliminar este cliente?
              </p>
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg mb-4`}>
                <p className={`${textPrimary} font-bold mb-2`}>{clientToDelete.nombre}</p>
                {clientToDelete.telefono && (
                  <p className={`${textSecondary} text-sm`}>📞 {clientToDelete.telefono}</p>
                )}
                {clientToDelete.email && (
                  <p className={`${textSecondary} text-sm`}>✉️ {clientToDelete.email}</p>
                )}
              </div>
              <p className={`${textSecondary} text-sm mb-6`}>
                <strong>Nota:</strong> El cliente se eliminará pero los registros de muestras asociados permanecerán en el sistema.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={deleteClient}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-all font-semibold"
                >
                  Sí, Eliminar
                </button>
                <button
                  onClick={() => {
                    setShowDeleteClientModal(false);
                    setClientToDelete(null);
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Dashboard del Cliente */}
        {showClientDashboard && selectedClient && (() => {
          const clientAnalytics = getClientAnalytics(selectedClient.nombre);
          const clientHistory = getClientHistory(selectedClient.nombre);
          
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className={`${cardBg} rounded-2xl p-8 max-w-6xl w-full my-8 max-h-[95vh] overflow-y-auto`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-3xl font-bold ${textPrimary} mb-2`}>📊 Dashboard de Cliente</h3>
                    <p className={`text-xl ${textSecondary}`}>{selectedClient.nombre}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowClientDashboard(false);
                      setSelectedClient(null);
                    }}
                    className={`${textSecondary} hover:${textPrimary} text-3xl px-3`}
                  >
                    ✕
                  </button>
                </div>

                {clientHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className={`w-20 h-20 mx-auto mb-4 ${textSecondary}`} />
                    <p className={`${textSecondary} text-lg`}>Este cliente aún no tiene muestras registradas</p>
                  </div>
                ) : (
                  <>
                    {/* Información del Cliente */}
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6 mb-6`}>
                      <h4 className={`text-lg font-bold ${textPrimary} mb-4`}>📋 Información del Cliente</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedClient.telefono && (
                          <div>
                            <p className={`text-sm ${textSecondary}`}>Teléfono</p>
                            <p className={`text-lg ${textPrimary} font-semibold`}>📞 {selectedClient.telefono}</p>
                          </div>
                        )}
                        {selectedClient.email && (
                          <div>
                            <p className={`text-sm ${textSecondary}`}>Email</p>
                            <p className={`text-lg ${textPrimary} font-semibold`}>✉️ {selectedClient.email}</p>
                          </div>
                        )}
                        {selectedClient.direccion && (
                          <div>
                            <p className={`text-sm ${textSecondary}`}>Dirección</p>
                            <p className={`text-lg ${textPrimary} font-semibold`}>📍 {selectedClient.direccion}</p>
                          </div>
                        )}
                        <div>
                          <p className={`text-sm ${textSecondary}`}>Cliente desde</p>
                          <p className={`text-lg ${textPrimary} font-semibold`}>📅 {new Date(clientAnalytics.primeraVisita).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {selectedClient.notas && (
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <p className={`text-sm ${textSecondary}`}>Notas</p>
                          <p className={`${textPrimary} mt-1`}>{selectedClient.notas}</p>
                        </div>
                      )}
                    </div>

                    {/* Tarjetas de Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                        <p className="text-blue-100 text-sm">Total de Muestras</p>
                        <p className="text-3xl font-bold mt-2">{clientAnalytics.totalMuestras}</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                        <p className="text-purple-100 text-sm">Color Favorito</p>
                        <p className="text-xl font-bold mt-2">{clientAnalytics.colorMasSolicitado[0]}</p>
                        <p className="text-purple-100 text-sm">{clientAnalytics.colorMasSolicitado[1]} veces</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                        <p className="text-green-100 text-sm">Colorista Preferido</p>
                        <p className="text-xl font-bold mt-2">{clientAnalytics.coloristaMasUsado[0]}</p>
                        <p className="text-green-100 text-sm">{clientAnalytics.coloristaMasUsado[1]} trabajos</p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
                        <p className="text-orange-100 text-sm">Última Muestra</p>
                        <p className="text-lg font-bold mt-2">{new Date(clientAnalytics.ultimaVisita).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Gráfico de Colores */}
                      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6`}>
                        <h4 className={`text-lg font-bold ${textPrimary} mb-4`}>🎨 Colores Solicitados</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={clientAnalytics.colorData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Gráfico de Coloristas */}
                      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6`}>
                        <h4 className={`text-lg font-bold ${textPrimary} mb-4`}>👨‍🎨 Distribución por Colorista</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={clientAnalytics.coloristaData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {clientAnalytics.coloristaData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Gráfico de Tendencia Mensual */}
                    {clientAnalytics.monthlyData.length > 1 && (
                      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6 mb-6`}>
                        <h4 className={`text-lg font-bold ${textPrimary} mb-4`}>📈 Historial Mensual</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={clientAnalytics.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="muestras" stroke="#8b5cf6" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Historial Completo de Muestras */}
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6`}>
                      <h4 className={`text-lg font-bold ${textPrimary} mb-4`}>📝 Historial de Muestras ({clientHistory.length})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-200'}>
                            <tr>
                              <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Fecha</th>
                              <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Color</th>
                              <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Colorista</th>
                              <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Domiciliario</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientHistory.map((survey) => (
                              <tr key={survey.id} className={`border-b ${darkMode ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-300 hover:bg-gray-100'}`}>
                                <td className={`px-4 py-3 text-sm ${textSecondary}`}>
                                  {new Date(survey.fecha).toLocaleDateString()}
                                </td>
                                <td className={`px-4 py-3 text-sm ${textPrimary} font-medium`}>
                                  {survey.color}
                                </td>
                                <td className={`px-4 py-3 text-sm ${textSecondary}`}>
                                  {survey.colorista}
                                </td>
                                <td className={`px-4 py-3 text-sm ${textSecondary}`}>
                                  {survey.domiciliario}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Botón de Cerrar al Final */}
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => {
                          setShowClientDashboard(false);
                          setSelectedClient(null);
                        }}
                        className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-all font-semibold"
                      >
                        Cerrar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        <div className="mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Total de Muestras</p>
                <p className="text-3xl font-bold mt-1">{surveys.length}</p>
                <p className="text-indigo-100 text-sm mt-1">registradas</p>
              </div>
              <Package className="w-12 h-12 text-indigo-200" />
            </div>
          </div>
        </div>

        {surveys.length === 0 ? (
          <div className={`${cardBg} rounded-2xl shadow-lg p-12 text-center`}>
            <Package className={`w-20 h-20 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-2xl font-semibold ${textSecondary} mb-2`}>No hay registros aún</h3>
            <p className={textSecondary}>Los registros aparecerán aquí</p>
          </div>
        ) : (
          <>
            {analytics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Color Más Deseado</p>
                        <p className="text-2xl font-bold mt-1">{analytics.colorMasDeseado[0] || 'N/A'}</p>
                        <p className="text-blue-100 text-sm mt-1">{analytics.colorMasDeseado[1] || 0} muestras</p>
                      </div>
                      <Palette className="w-12 h-12 text-blue-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Top Domiciliario</p>
                        <p className="text-2xl font-bold mt-1">{analytics.domiciliarioTop[0] || 'N/A'}</p>
                        <p className="text-green-100 text-sm mt-1">{analytics.domiciliarioTop[1] || 0} entregas</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-green-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Top Colorista</p>
                        <p className="text-2xl font-bold mt-1">{analytics.coloristaTop[0] || 'N/A'}</p>
                        <p className="text-purple-100 text-sm mt-1">{analytics.coloristaTop[1] || 0} muestras</p>
                      </div>
                      <Users className="w-12 h-12 text-purple-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Top Cliente</p>
                        <p className="text-2xl font-bold mt-1">{analytics.clienteTop[0] || 'N/A'}</p>
                        <p className="text-orange-100 text-sm mt-1">{analytics.clienteTop[1] || 0} muestras</p>
                      </div>
                      <Package className="w-12 h-12 text-orange-200" />
                    </div>
                  </div>
                </div>

                <div className={`${cardBg} rounded-xl shadow-lg p-6 mb-6`}>
                  <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>📈 Tendencia (Últimos 30 Días)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="muestras" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Tablas Comparativas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Tabla Comparativa de Coloristas */}
                  <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>Tabla Comparativa de Coloristas</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                          <tr>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Pos.</th>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Colorista</th>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Muestras</th>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.coloristaData.map((colorista, index) => {
                            const total = analytics.coloristaData.reduce((sum, c) => sum + c.value, 0);
                            const percentage = ((colorista.value / total) * 100).toFixed(1);
                            return (
                              <tr key={colorista.name} className={`border-b ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                <td className={`px-4 py-3 text-sm ${textSecondary}`}>#{index + 1}</td>
                                <td className={`px-4 py-3 text-sm font-medium ${textPrimary}`}>{colorista.name}</td>
                                <td className={`px-4 py-3 text-sm ${textSecondary}`}>{colorista.value}</td>
                                <td className={`px-4 py-3 text-sm ${textSecondary}`}>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
                                      <div 
                                        className="bg-purple-500 h-2 rounded-full" 
                                        style={{width: `${percentage}%`}}
                                      ></div>
                                    </div>
                                    <span className="text-xs">{percentage}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tabla Comparativa de Domiciliarios */}
                  <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>Tabla Comparativa de Domiciliarios</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                          <tr>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Pos.</th>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Domiciliario</th>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Entregas</th>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.domiciliarioData.sort((a, b) => b.value - a.value).map((domiciliario, index) => {
                            const total = analytics.domiciliarioData.reduce((sum, d) => sum + d.value, 0);
                            const percentage = ((domiciliario.value / total) * 100).toFixed(1);
                            return (
                              <tr key={domiciliario.name} className={`border-b ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                <td className={`px-4 py-3 text-sm ${textSecondary}`}>#{index + 1}</td>
                                <td className={`px-4 py-3 text-sm font-medium ${textPrimary}`}>{domiciliario.name}</td>
                                <td className={`px-4 py-3 text-sm ${textSecondary}`}>{domiciliario.value}</td>
                                <td className={`px-4 py-3 text-sm ${textSecondary}`}>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
                                      <div 
                                        className="bg-green-500 h-2 rounded-full" 
                                        style={{width: `${percentage}%`}}
                                      ></div>
                                    </div>
                                    <span className="text-xs">{percentage}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>Colores Más Solicitados</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.colorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>Distribución por Colorista</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.coloristaData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.coloristaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>Domiciliarios con Más Entregas</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.domiciliarioData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>Clientes con Más Muestras</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.clienteData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
                  <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>Todos los Registros ({getFilteredSurveys().length})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Fecha</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Perfil</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Domiciliario</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Cliente</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Color</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Colorista</th>
                          <th className={`px-4 py-3 text-left text-sm font-semibold ${textPrimary}`}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredSurveys().map((survey) => (
                          <tr key={survey.id} className={`border-b ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                            <td className={`px-4 py-3 text-sm ${textSecondary}`}>{new Date(survey.fecha).toLocaleString()}</td>
                            <td className={`px-4 py-3 text-sm font-medium ${textPrimary}`}>{survey.perfil}</td>
                            <td className={`px-4 py-3 text-sm ${textSecondary}`}>{survey.domiciliario}</td>
                            <td className={`px-4 py-3 text-sm ${textSecondary}`}>{survey.cliente}</td>
                            <td className={`px-4 py-3 text-sm ${textSecondary}`}>{survey.color}</td>
                            <td className={`px-4 py-3 text-sm ${textSecondary}`}>{survey.colorista}</td>
                            <td className={`px-4 py-3 text-sm`}>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditModal(survey)}
                                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-all"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteSurveyModal(survey)}
                                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ColorSampleTracker;