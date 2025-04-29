/**
 * Serviço para gerenciamento de horário de pico
 * Responsável por calcular preços e gerenciar horários de pico
 */

import { db, adm, isFirebaseInitialized } from '../config/firebaseConfig.js';

export class PeakHourService {
    constructor() {
        this.peakHours = {
            morning: { start: '07:00', end: '09:00' },
            evening: { start: '17:00', end: '19:00' }
        };
        this.multiplier = 1.5; // Multiplicador de preço durante o horário de pico
        this.isPeakHour = false;
        this.peakHourConfigs = {}; // Armazenará as configurações de horário de pico por país/município
        this.vehicleClasses = {}; // Armazenará as configurações de classes de veículos
    }

    async initialize() {
        try {
            // Tenta acessar o Firestore
            this.db = await db();
            await this.loadPeakHourConfigs(); // Carrega as configurações do Firebase ao inicializar
            await this.loadVehicleClasses(); // Carrega as classes de veículos do Firebase ao inicializar
            await this.setupFirestoreListeners(); // Configura os listeners para mudanças em tempo real
            return this;
        } catch (error) {
            console.error('Erro ao inicializar o serviço de horário de pico:', error);
            throw new Error('Falha ao inicializar o serviço de horário de pico. Verifique se o Firebase foi inicializado corretamente.');
        }
    }

    /**
     * Configura os listeners do Firestore para detectar mudanças em tempo real
     */
    setupFirestoreListeners() {
        // Listener para mudanças nas configurações de horário de pico
        this.db.collection('peak_hours').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                const data = change.doc.data();
                const key = this.getConfigKey(data.country, data.province, data.municipality);
                
                if (change.type === 'added' || change.type === 'modified') {
                    // Adiciona ou atualiza a configuração localmente
                    this.peakHourConfigs[key] = {
                        country: data.country,
                        province: data.province,
                        municipality: data.municipality,
                        startTime: data.startTime,
                        endTime: data.endTime,
                        pricePerHour: data.pricePerHour,
                        status: data.status
                    };
                    console.log(`Configuração de horário de pico ${change.type === 'added' ? 'adicionada' : 'atualizada'}: ${key}`);
                } else if (change.type === 'removed') {
                    // Remove a configuração localmente
                    delete this.peakHourConfigs[key];
                    console.log(`Configuração de horário de pico removida: ${key}`);
                }
            });
        }, error => {
            console.error('Erro ao configurar listener de horário de pico:', error);
        });

        // Listener para mudanças nas classes de veículos
        this.db.collection('vehicle_class').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                const data = change.doc.data();
                const id = change.doc.id;
                
                if (change.type === 'added' || change.type === 'modified') {
                    // Adiciona ou atualiza a classe de veículo localmente
                    this.vehicleClasses[id] = {
                        id,
                        basePrice: data.basePrice || 0,
                        basePriceMin: data.basePriceMin || 0,
                        basePricePerKm: data.basePricePerKm || 0,
                        description: data.description || '',
                        designation: data.designation || '',
                        iconCategory: data.iconCategory || '',
                        iconMap: data.iconMap || '',
                        isDefault: data.isDefault || false,
                        passengers: data.passengers || 0,
                        percentage: data.percentage || 0,
                        tarifaBase: data.tarifaBase || 0
                    };
                    console.log(`Classe de veículo ${change.type === 'added' ? 'adicionada' : 'atualizada'}: ${id}`);
                } else if (change.type === 'removed') {
                    // Remove a classe de veículo localmente
                    delete this.vehicleClasses[id];
                    console.log(`Classe de veículo removida: ${id}`);
                }
            });
        }, error => {
            console.error('Erro ao configurar listener de classes de veículos:', error);
        });
    }

    /**
     * Carrega as configurações de horário de pico do Firebase
     */
    async loadPeakHourConfigs() {
        try {
            const snapshot = await this.db.collection('peak_hours').get();
            this.peakHourConfigs = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const key = this.getConfigKey(data.country, data.province, data.municipality);
                this.peakHourConfigs[key] = {
                    country: data.country,
                    province: data.province,
                    municipality: data.municipality,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    pricePerHour: data.pricePerHour,
                    status: data.status
                };
            });
            
            console.log('Configurações de horário de pico carregadas com sucesso');
        } catch (error) {
            console.error('Erro ao carregar configurações de horário de pico:', error);
        }
    }

    /**
     * Carrega as classes de veículos do Firebase
     */
    async loadVehicleClasses() {
        try {
            const snapshot = await this.db.collection('vehicle_class').get();
            this.vehicleClasses = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                this.vehicleClasses[doc.id] = {
                    id: doc.id,
                    basePrice: data.basePrice || 0,
                    basePriceMin: data.basePriceMin || 0,
                    basePricePerKm: data.basePricePerKm || 0,
                    description: data.description || '',
                    designation: data.designation || '',
                    iconCategory: data.iconCategory || '',
                    iconMap: data.iconMap || '',
                    isDefault: data.isDefault || false,
                    passengers: data.passengers || 0,
                    percentage: data.percentage || 0,
                    tarifaBase: data.tarifaBase || 0
                };
            });
            
            console.log('Classes de veículos carregadas com sucesso');
        } catch (error) {
            console.error('Erro ao carregar classes de veículos:', error);
        }
    }

    /**
     * Gera uma chave única para as configurações de horário de pico
     * @param {string} country - País
     * @param {string} province - Província
     * @param {string} municipality - Município
     * @returns {string} Chave única para as configurações
     */
    getConfigKey(country, province, municipality) {
        return `${country}_${province}_${municipality}`.toLowerCase();
    }

    /**
     * Verifica se o horário atual está dentro do período de pico para uma localização específica
     * @param {string} country - País
     * @param {string} province - Província
     * @param {string} municipality - Município
     * @returns {boolean} true se estiver em horário de pico, false caso contrário
     */
    isWithinPeakHours(country, province, municipality) {
        const key = this.getConfigKey(country, province, municipality);
        const config = this.peakHourConfigs[key];
        
        if (!config || config.status !== 'ativo') {
            return false;
        }
        
        const now = new Date();
        const currentTime = now.toLocaleTimeString('pt-BR', { hour12: false });
        
        this.isPeakHour = this.isTimeBetween(currentTime, config.startTime, config.endTime);
        return this.isPeakHour;
    }

    /**
     * Verifica se um horário está entre dois horários
     * @param {string} time - Horário a ser verificado (formato HH:mm)
     * @param {string} start - Horário de início (formato HH:mm)
     * @param {string} end - Horário de fim (formato HH:mm)
     * @returns {boolean} true se o horário estiver entre start e end
     */
    isTimeBetween(time, start, end) {
        return time >= start && time <= end;
    }

    /**
     * Obtém a classe de veículo pelo ID
     * @param {string} vehicleClassId - ID da classe de veículo
     * @returns {Object|null} Classe de veículo ou null se não encontrada
     */
    getVehicleClass(vehicleClassId) {
        return this.vehicleClasses[vehicleClassId] || null;
    }

    /**
     * Obtém a classe de veículo padrão
     * @returns {Object|null} Classe de veículo padrão ou null se não encontrada
     */
    getDefaultVehicleClass() {
        return Object.values(this.vehicleClasses).find(vehicleClass => vehicleClass.isDefault) || null;
    }

    /**
     * Calcula o preço final considerando o horário de pico para uma localização específica
     * @param {number} basePrice - Preço base da corrida
     * @param {string} country - País
     * @param {string} province - Província
     * @param {string} municipality - Município
     * @param {string} vehicleClassId - ID da classe de veículo
     * @returns {number} Preço final calculado
     */
    calculatePeakPrice(basePrice, country, province, municipality, vehicleClassId) {
        const key = this.getConfigKey(country, province, municipality);
        const config = this.peakHourConfigs[key];
        
        if (!config || config.status !== 'ativo') {
            return basePrice;
        }
        
        if (this.isWithinPeakHours(country, province, municipality)) {
            // Se não for fornecido um preço base, usa o preço base da classe de veículo
            if (!basePrice && vehicleClassId) {
                const vehicleClass = this.getVehicleClass(vehicleClassId);
                if (vehicleClass) {
                    basePrice = vehicleClass.basePrice;
                }
            }
            
            // Calcula o multiplicador com base no preço por hora
            const multiplier = config.pricePerHour / 10; // Assumindo que o preço base é 10
            return basePrice * multiplier;
        }
        
        return basePrice;
    }

    /**
     * Retorna o status atual do horário de pico para uma localização específica
     * @param {string} country - País
     * @param {string} province - Província
     * @param {string} municipality - Município
     * @returns {Object} Status do horário de pico
     */
    getPeakStatus(country, province, municipality) {
        const key = this.getConfigKey(country, province, municipality);
        const config = this.peakHourConfigs[key];
        
        return {
            isPeakHour: this.isWithinPeakHours(country, province, municipality),
            currentTime: new Date().toISOString(),
            config: config || null,
            allConfigs: this.peakHourConfigs
        };
    }

    /**
     * Atualiza as configurações de horário de pico no Firebase
     * @param {Object} newConfig - Nova configuração de horário de pico
     */
    async updatePeakHourConfig(newConfig) {
        try {
            const { country, province, municipality, startTime, endTime, pricePerHour, status } = newConfig;
            
            if (!country || !province || !municipality || !startTime || !endTime || !pricePerHour || !status) {
                throw new Error('Todos os campos são obrigatórios');
            }
            
            const key = this.getConfigKey(country, province, municipality);
            
            // Atualiza no Firebase
            await this.db.collection('peak_hours').doc(key).set({
                country,
                province,
                municipality,
                startTime,
                endTime,
                pricePerHour,
                status
            });
            
            // Atualiza na memória
            this.peakHourConfigs[key] = {
                country,
                province,
                municipality,
                startTime,
                endTime,
                pricePerHour,
                status
            };
            
            return { success: true, message: 'Configuração atualizada com sucesso' };
        } catch (error) {
            console.error('Erro ao atualizar configuração de horário de pico:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove uma configuração de horário de pico do Firebase
     * @param {string} country - País
     * @param {string} province - Província
     * @param {string} municipality - Município
     */
    async removePeakHourConfig(country, province, municipality) {
        try {
            const key = this.getConfigKey(country, province, municipality);
            
            // Remove do Firebase
            await this.db.collection('peak_hours').doc(key).delete();
            
            // Remove da memória
            delete this.peakHourConfigs[key];
            
            return { success: true, message: 'Configuração removida com sucesso' };
        } catch (error) {
            console.error('Erro ao remover configuração de horário de pico:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Atualiza uma classe de veículo no Firebase
     * @param {Object} vehicleClass - Classe de veículo a ser atualizada
     */
    async updateVehicleClass(vehicleClass) {
        try {
            const { id, basePrice, basePriceMin, basePricePerKm, description, designation, 
                    iconCategory, iconMap, isDefault, passengers, percentage, tarifaBase } = vehicleClass;
            
            if (!id) {
                throw new Error('ID da classe de veículo é obrigatório');
            }
            
            // Atualiza no Firebase
            await this.db.collection('vehicle_class').doc(id).set({
                basePrice: basePrice || 0,
                basePriceMin: basePriceMin || 0,
                basePricePerKm: basePricePerKm || 0,
                description: description || '',
                designation: designation || '',
                iconCategory: iconCategory || '',
                iconMap: iconMap || '',
                isDefault: isDefault || false,
                passengers: passengers || 0,
                percentage: percentage || 0,
                tarifaBase: tarifaBase || 0
            });
            
            // Atualiza na memória
            this.vehicleClasses[id] = {
                id,
                basePrice: basePrice || 0,
                basePriceMin: basePriceMin || 0,
                basePricePerKm: basePricePerKm || 0,
                description: description || '',
                designation: designation || '',
                iconCategory: iconCategory || '',
                iconMap: iconMap || '',
                isDefault: isDefault || false,
                passengers: passengers || 0,
                percentage: percentage || 0,
                tarifaBase: tarifaBase || 0
            };
            
            return { success: true, message: 'Classe de veículo atualizada com sucesso' };
        } catch (error) {
            console.error('Erro ao atualizar classe de veículo:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove uma classe de veículo do Firebase
     * @param {string} vehicleClassId - ID da classe de veículo
     */
    async removeVehicleClass(vehicleClassId) {
        try {
            if (!vehicleClassId) {
                throw new Error('ID da classe de veículo é obrigatório');
            }
            
            // Remove do Firebase
            await this.db.collection('vehicle_class').doc(vehicleClassId).delete();
            
            // Remove da memória
            delete this.vehicleClasses[vehicleClassId];
            
            return { success: true, message: 'Classe de veículo removida com sucesso' };
        } catch (error) {
            console.error('Erro ao remover classe de veículo:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Atualiza os preços na base de dados quando o horário de pico começa ou termina
     * @param {string} country - País
     * @param {string} province - Província
     * @param {string} municipality - Município
     * @param {boolean} isPeakHour - Se está em horário de pico
     * @returns {Promise<Object>} Resultado da operação
     */
    async updatePricesInDatabase(country, province, municipality, isPeakHour) {
        try {
            const key = this.getConfigKey(country, province, municipality);
            const config = this.peakHourConfigs[key];
            
            if (!config || config.status !== 'ativo') {
                return { success: false, message: 'Configuração de horário de pico não encontrada ou inativa' };
            }
            
            // Obter o multiplicador de preço
            const priceMultiplier = isPeakHour ? (config.pricePerHour / 10) : 1;
            
            // Buscar todas as corridas ativas para esta localização
            const racesSnapshot = await this.db.collection('races')
                .where('country', '==', country)
                .where('province', '==', province)
                .where('municipality', '==', municipality)
                .where('status', '==', 5) // Corridas em andamento
                .get();
            
            if (racesSnapshot.empty) {
                console.log(`Nenhuma corrida ativa encontrada para ${municipality}, ${province}, ${country}`);
                return { success: true, message: 'Nenhuma corrida ativa encontrada para atualizar' };
            }
            
            // Atualizar cada corrida
            const batch = this.db.batch();
            let updatedCount = 0;
            
            for (const doc of racesSnapshot.docs) {
                const raceData = doc.data();
                const basePrice = raceData.basePrice || 0;
                
                // Calcular o preço final com base no horário de pico
                const finalPrice = isPeakHour ? basePrice * priceMultiplier : basePrice;
                
                // Atualizar o documento
                batch.update(doc.ref, {
                    isPeakHour,
                    priceMultiplier,
                    finalPrice
                });
                
                updatedCount++;
            }
            
            // Executar o batch
            await batch.commit();
            
            console.log(`${updatedCount} corridas atualizadas para horário de pico: ${isPeakHour}`);
            return { 
                success: true, 
                message: `${updatedCount} corridas atualizadas para horário de pico: ${isPeakHour}` 
            };
        } catch (error) {
            console.error('Erro ao atualizar preços na base de dados:', error);
            return { success: false, error: error.message };
        }
    }

    static getInstance() {
        if (!PeakHourService.instance) {
            PeakHourService.instance = new PeakHourService();
        }
        return PeakHourService.instance;
    }
}
