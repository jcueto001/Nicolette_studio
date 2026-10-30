const mockData = {
    // Perfiles de usuarias para recomendaciones
    profiles: [
        { id: 'mama', label: 'Mamá', icon: 'baby', desc: 'Espacios Kids Friendly' },
        { id: 'turnos', label: 'Turnos Rotativos', icon: 'clock', desc: 'Horarios flexibles y extendidos' },
        { id: 'ejecutiva', label: 'Ejecutiva', icon: 'briefcase', desc: 'Puntualidad y combos express' },
        { id: 'evento', label: 'Ocasión Especial', icon: 'star', desc: 'Producción completa' }
    ],

    // Categorías de Servicios
    categories: [
        { id: 'capilar', label: 'Cabello & Capilar', icon: 'heart', desc: 'Corte, peinado, coloración y tratamientos fotónicos' },
        { id: 'manicura', label: 'Manicura', icon: 'sparkles', desc: 'Uñas, esmaltados y extensiones' },
        { id: 'pedicure', label: 'Pedicure', icon: 'footprints', desc: 'Cuidado y spa de pies' },
        { id: 'podologia', label: 'Podología Clínica', icon: 'stethoscope', desc: 'Por Podóloga Priscila Villarreal, ROL MINSAL 164959' },
        { id: 'pestanas-cejas', label: 'Pestañas & Cejas', icon: 'eye', desc: 'Lifting coreano, extensiones y diseño' },
        { id: 'depilacion-femenina', label: 'Depilación Femenina', icon: 'flower', desc: 'Cera de abeja hipoalergénica' },
        { id: 'depilacion', label: 'Depilación Masculina', icon: 'scissors', desc: 'Cera caliente de miel de abeja' },
        // Compatibilidad previa
        { id: 'manos-pies', label: 'Manicure & Pedicure', icon: 'sparkles' },
        { id: 'mirada', label: 'Lashista & Mirada', icon: 'eye' },
        { id: 'bienestar', label: 'Bienestar y Relax', icon: 'smile' }
    ],

    // Servicios
    services: [
        // --- MANICURA (Lista Oficial) ---
        {
            id: 's1',
            categoryId: 'manicura',
            categoryGroup: 'manicura',
            name: 'Permanente',
            price: 15000,
            duration: 60,
            description: 'Un solo tono + 2 diseños simples.',
            adicionales: 'Francesa o degradé (+$5.000) • Diseños aparte ($1.000 el par)',
            recommendedFor: ['turnos', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_mani_ruber',
            categoryId: 'manicura',
            categoryGroup: 'manicura',
            name: 'Ruber',
            price: 20000,
            duration: 75,
            description: 'Un solo tono + 2 diseños simples. Base niveladora y fortalecedora para uñas naturales.',
            adicionales: 'Francesa o degradé (+$5.000) • Diseños aparte ($1.000 el par)',
            recommendedFor: ['ejecutiva', 'mama'],
            image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_mani_kapping',
            categoryId: 'manicura',
            categoryGroup: 'manicura',
            name: 'Kapping Poly Gel',
            price: 20000,
            duration: 80,
            description: 'Uña corta | Un solo tono + 2 diseños simples. Protección y resistencia.',
            adicionales: 'Kapping en tamaños M, L, XL y más tienen valor adicional • Francesa/Degradé (+$5.000)',
            recommendedFor: ['turnos', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_mani_softgel',
            categoryId: 'manicura',
            categoryGroup: 'manicura',
            name: 'Soft Gel',
            price: 25000,
            duration: 90,
            description: 'Un solo tono + 2 diseños simples. Tips completos de gel de alta duración y aspecto natural.',
            adicionales: 'Francesa o degradé (+$5.000) • Diseños aparte ($1.000 el par)',
            recommendedFor: ['evento', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's2',
            categoryId: 'manicura',
            categoryGroup: 'manicura',
            name: 'Extensión Poly Gel',
            price: 28000,
            duration: 120,
            description: 'Un solo tono + 2 diseños simples. Esculpido profesional de máxima duración.',
            adicionales: 'Extensión de uñas en tamaños L, XL y más tienen valor adicional • Francesa/Degradé (+$5.000)',
            recommendedFor: ['evento'],
            image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },

        // --- PEDICURE (Lista Oficial) ---
        {
            id: 's_pedi_limpieza',
            categoryId: 'pedicure',
            categoryGroup: 'pedicure',
            name: 'Limpieza de Pies',
            price: 15000,
            duration: 45,
            description: 'Corte de uñas, Limpieza de talones, Hidratación de pies. Pies limpios, sanos y cómodos.',
            adicionales: 'Francesa o degradé (+$5.000) • Diseños extras ($1.000 el par)',
            recommendedFor: ['bienestar', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_pedi_spa',
            categoryId: 'pedicure',
            categoryGroup: 'pedicure',
            name: 'Limpieza de Pies + Spa',
            price: 20000,
            duration: 60,
            description: 'Corte de uñas, Exfoliación de pies, Limpieza de talones, Hidratación de pies. Pies renovados y llenos de bienestar.',
            adicionales: 'Francesa o degradé (+$5.000) • Diseños extras ($1.000 el par)',
            recommendedFor: ['bienestar', 'mama'],
            image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_pedi_esmaltado',
            categoryId: 'pedicure',
            categoryGroup: 'pedicure',
            name: 'Pedicure con Esmaltado',
            price: 25000,
            duration: 75,
            description: 'Corte de uñas, Limpieza de talones, Hidratación de pies, Esmaltado permanente en un solo tono + 2 diseños básicos. Color y cuidado en cada paso.',
            adicionales: 'Francesa o degradé (+$5.000) • Diseños extras ($1.000 el par)',
            recommendedFor: ['evento', 'bienestar'],
            image: 'https://images.unsplash.com/photo-1583001809873-a128495da465?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_pedi_premium',
            categoryId: 'pedicure',
            categoryGroup: 'pedicure',
            name: 'Pedicure Spa Premium',
            price: 35000,
            duration: 90,
            description: 'Corte de uñas, Limpieza de talones, Eliminación de durezas, Exfoliación de pies, Hidratación de pies, Masaje de relajación, Esmaltado permanente en un solo tono + 2 diseños básicos. La experiencia completa para unos pies increíbles.',
            adicionales: 'Francesa o degradé (+$5.000) • Diseños extras ($1.000 el par)',
            recommendedFor: ['bienestar', 'evento'],
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },

        // --- PESTAÑAS & CEJAS (Lista Oficial) ---
        {
            id: 's_pest_laminado',
            categoryId: 'pestanas-cejas',
            categoryGroup: 'pestanas-cejas',
            name: 'Laminado de Cejas',
            price: 20000,
            duration: 45,
            description: 'Define, ordena y da forma a tus cejas. Acabado prolijo y natural.',
            adicionales: 'Llegar con cejas y pestañas limpias sin residuos de maquillaje 24h antes',
            recommendedFor: ['ejecutiva', 'evento'],
            image: 'https://images.unsplash.com/photo-1588510849202-3866299d6d84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's3',
            categoryId: 'pestanas-cejas',
            categoryGroup: 'pestanas-cejas',
            name: 'Lifting Coreano',
            price: 25000,
            duration: 60,
            description: 'Realza tu mirada de forma natural, levanta y define tus pestañas con técnica coreana avanzada.',
            adicionales: 'Se pide llegar con pestañas limpias sin maquillaje 24h antes para mejor retención',
            recommendedFor: ['mama', 'ejecutiva'],
            image: 'https://th.bing.com/th/id/OIP.2pIe9UC-BXmhjwRBZtYmDAHaE2?w=305&h=200&c=7&r=0&o=7&pid=1.7&rm=3'
        },
        {
            id: 's_pest_clasica',
            categoryId: 'pestanas-cejas',
            categoryGroup: 'pestanas-cejas',
            name: 'Extensiones de Pestañas Rímel o Clásica',
            price: 25000,
            duration: 90,
            description: 'Un efecto natural y elegante para tu día a día (técnica pelo a pelo / efecto rímel).',
            adicionales: 'Se pide llegar con pestañas limpias sin maquillaje 24h antes',
            recommendedFor: ['ejecutiva', 'mama'],
            image: 'https://images.unsplash.com/photo-1583001809873-a128495da465?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_pest_tecno',
            categoryId: 'pestanas-cejas',
            categoryGroup: 'pestanas-cejas',
            name: 'Extensión de Pestañas Tecnológicas',
            price: 30000,
            duration: 90,
            description: 'Más volumen, más definición, más duración con fibras tecnológicas ultralivianas.',
            adicionales: 'Se pide llegar con pestañas limpias sin maquillaje 24h antes',
            recommendedFor: ['evento', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_pest_volumen',
            categoryId: 'pestanas-cejas',
            categoryGroup: 'pestanas-cejas',
            name: 'Volumen Tecnológico',
            price: 35000,
            duration: 105,
            description: 'Desde $35.000. Una mirada impactante, densa y personalizada.',
            adicionales: 'Se pide llegar con pestañas limpias sin maquillaje 24h antes',
            recommendedFor: ['evento'],
            image: 'https://images.unsplash.com/photo-1588510849202-3866299d6d84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },

        // --- DEPILACIÓN MASCULINA (Cera Caliente Miel de Abeja) ---
        {
            id: 's_dep_cejas',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Cejas (Masculina)',
            price: 5000,
            duration: 20,
            description: 'Definición y limpieza con cera caliente de miel de abeja natural.',
            adicionales: 'Materiales descartables y ambiente higiénico profesional',
            recommendedFor: ['ejecutiva', 'bienestar'],
            image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_nariz',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Nariz',
            price: 5000,
            duration: 15,
            description: 'Eliminación de vello nasal con máxima higiene y confort.',
            adicionales: 'Cera suave con la piel',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_orejas',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Orejas',
            price: 5000,
            duration: 15,
            description: 'Eliminación de vello en pabellón auricular.',
            adicionales: 'Rápido, higiénico y efectivo',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_hombros',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Hombros',
            price: 7000,
            duration: 20,
            description: 'Depilación de hombros con cera caliente de miel.',
            adicionales: 'Efecto limpio y duradero',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_axilas',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Axilas (Masculina)',
            price: 8000,
            duration: 20,
            description: 'Piel limpia, fresca y libre de vello.',
            adicionales: 'Cera de miel más suave con la piel',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_pecho',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Pecho',
            price: 10000,
            duration: 30,
            description: 'Depilación de pecho con cera tibia de miel de abeja.',
            adicionales: 'Resultados limpios, cómodos y naturales',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_abdomen',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Abdomen',
            price: 10000,
            duration: 30,
            description: 'Depilación de abdomen completa.',
            adicionales: 'Piel más limpia y cuidada',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_media_pierna',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Media Pierna',
            price: 10000,
            duration: 30,
            description: 'Desde rodilla a tobillo.',
            adicionales: 'Cera natural de miel',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_brazos',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Brazos Completos',
            price: 15000,
            duration: 35,
            description: 'Depilación completa de ambos brazos.',
            adicionales: 'Materiales descartables y atención personalizada',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_pecho_abdomen',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Pecho + Abdomen',
            price: 18000,
            duration: 45,
            description: 'Zona superior del torso completa (Pecho y Abdomen).',
            adicionales: 'Combo torso completo',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_espalda',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Espalda Completa',
            price: 18000,
            duration: 45,
            description: 'Depilación completa de espalda para máxima frescura.',
            adicionales: 'Cera de abeja natural',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_piernas_completas',
            categoryId: 'depilacion',
            categoryGroup: 'depilacion',
            name: 'Depilación Piernas Completas',
            price: 22000,
            duration: 50,
            description: 'Desde muslo a tobillo.',
            adicionales: 'Piel limpia, cuidada y duradera',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },

        // --- CABELLO & TRATAMIENTOS CAPILARES ---
        {
            id: 's4',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Masaje Capilar Nutritivo',
            price: 20000,
            duration: 45,
            description: 'Hidratación profunda con mascarilla nutritiva, masaje craneal relajante y sellado de cutícula.',
            adicionales: 'Ideal para revitalizar cabellos secos o procesados químicamente',
            recommendedFor: ['mama', 'bienestar'],
            image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_capilar_botox',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Botox Capilar Reconstructor',
            price: 30000,
            duration: 90,
            description: 'Reconstrucción intensiva de la fibra capilar, reducción de frizz y brillo efecto espejo.',
            adicionales: 'Nutrición con ácido hialurónico y keratina',
            recommendedFor: ['ejecutiva', 'evento'],
            image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_capilar_alisado',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Alisado & Nutrición Antifrizz',
            price: 45000,
            duration: 120,
            description: 'Tratamiento alisante progresivo termoactivo. Liso natural, disciplinado y sedoso.',
            adicionales: 'Sellado térmico profesional de larga duración',
            recommendedFor: ['evento', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_capilar_lavado_peinado',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Lavado Hidratante & Peinado Express',
            price: 15000,
            duration: 40,
            description: 'Lavado con productos profesionales, secado y peinado express o brushing.',
            adicionales: 'Perfecto para lucir impecable en tus días importantes',
            recommendedFor: ['evento', 'turnos'],
            image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },

        // --- CORTES & PEINADOS (CABELLO) ---
        {
            id: 's_cab_corte',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Corte de Cabello',
            price: 19990,
            duration: 45,
            description: 'Corte personalizado según tu estilo y necesidades. Un buen corte realza tu belleza natural.',
            adicionales: 'Tratamiento Capilar Adicional (Hidratación o nutrición + masaje capilar): +$9.990',
            recommendedFor: ['ejecutiva', 'evento'],
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_cab_corte_avanzado',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Corte Avanzado (con Lavado & Brushing)',
            price: 24990,
            duration: 60,
            description: 'Corte personalizado con mayor detalle y definición. Incluye lavado profesional y brushing.',
            adicionales: 'Tratamiento Capilar Adicional (+ masaje capilar): +$9.990',
            recommendedFor: ['evento', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_cab_brushing',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Brushing / Ondas / Liso',
            price: 19990,
            duration: 50,
            description: 'Lavado de cabello + peinado (liso, ondas o brushing). Lavado incluido para un resultado perfecto.',
            adicionales: 'Valores base consideran cabellos hasta largo L (hasta el codo)',
            recommendedFor: ['evento', 'turnos'],
            image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_cab_peinado_evento',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Peinado para Ocasión Especial',
            price: 24990,
            duration: 75,
            description: 'Desde $24.990. Lavado de cabello + peinado elaborado, adaptado a la ocasión y estilo deseado (recogidos, semi-recogidos, trenzas o fiesta).',
            adicionales: 'Cabellos XL o extra densidad pueden tener adicional',
            recommendedFor: ['evento'],
            image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },

        // --- COLORACIÓN (CABELLO) ---
        {
            id: 's_cab_color_raiz',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Tintura de Raíz (con Peinado)',
            price: 29990,
            duration: 90,
            description: 'Cobertura del crecimiento, respetando tu color y necesidades de tu cabello. INCLUYE acabado a elección: Brushing, Alisado u Ondas.',
            adicionales: 'Peinado especial elaborado adicional: +$9.990',
            recommendedFor: ['ejecutiva', 'evento'],
            image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_cab_bano_color',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Baño de Color (con Peinado)',
            price: 29990,
            duration: 75,
            description: 'Refresca el tono, aporta brillo y mantiene o realza tus reflejos. INCLUYE acabado: Brushing, Alisado u Ondas.',
            adicionales: 'Peinado especial elaborado adicional: +$9.990',
            recommendedFor: ['evento', 'mama'],
            image: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_cab_raiz_bano',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Raíz + Baño de Color (con Peinado)',
            price: 39990,
            duration: 120,
            description: 'Renovación del crecimiento + refresco y armonización del color en medios y puntas. INCLUYE acabado: Brushing, Alisado u Ondas.',
            adicionales: 'Peinado elaborado adicional: +$9.990',
            recommendedFor: ['ejecutiva', 'evento'],
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_cab_raiz_bano_tratam',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Raíz + Baño de Color + Tratamiento Capilar',
            price: 49990,
            duration: 140,
            description: 'Coloración + baño de color acompañado de tratamiento de hidratación o nutrición profunda y masaje capilar. INCLUYE brushing o peinado a elección.',
            adicionales: 'Combo completo de color y nutrición',
            recommendedFor: ['evento', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },

        // --- TRATAMIENTOS CAPILARES CON ACTIVACIÓN FOTÓNICA (Photon Lizze Supreme) ---
        {
            id: 's_tratam_hidratacion',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Hidratación Profunda (Activación Fotónica)',
            price: 25000,
            duration: 60,
            description: 'Devuelve suavidad, brillo y vitalidad. Incluye diagnóstico, aplicación, masaje capilar, lavado, secado, brushing y tecnología de Activación Fotónica Lizze Supreme.',
            adicionales: 'Base S (hombros): $25.000 | M: $30.000 | L: $35.000 | XL: $40.000',
            recommendedFor: ['mama', 'bienestar'],
            image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_tratam_reconstruccion',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Reconstrucción Capilar (Activación Fotónica)',
            price: 25000,
            duration: 65,
            description: 'Repara y fortalece la fibra capilar dañada. Incluye Activación Fotónica Photon Lizze Supreme, masaje, lavado y brushing.',
            adicionales: 'Base S (hombros): $25.000 | M: $30.000 | L: $35.000 | XL: $40.000',
            recommendedFor: ['evento', 'bienestar'],
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_tratam_ampolla',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Nutrición con Ampolla Capilar (Fotónica)',
            price: 30000,
            duration: 60,
            description: 'Aporta nutrientes intensivos y mejora la elasticidad. Potenciado con luz fotónica Lizze Supreme para absorción profunda.',
            adicionales: 'Base S (hombros): $30.000 | M: $35.000 | L: $40.000 | XL: $45.000',
            recommendedFor: ['ejecutiva', 'bienestar'],
            image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_tratam_nanobotox',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Nanobotox Capilar (Activación Fotónica)',
            price: 35000,
            duration: 90,
            description: 'Controla el frizz, aporta brillo extremo, disciplina y regenera la fibra capilar. Activación con luz fotónica y sellado térmico.',
            adicionales: 'Base S (hombros): $35.000 | M: $40.000 | L: $45.000 | XL: $55.000',
            recommendedFor: ['evento', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_tratam_personalizado',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Tratamiento Capilar Personalizado',
            price: 25000,
            duration: 60,
            description: 'Evaluación previa y diagnóstico capilar con especialista para determinar el tratamiento ideal según las necesidades específicas de tu cabello.',
            adicionales: 'Valor final según evaluación y largo del cabello',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },

        // ==========================================
        // --- PODOLOGÍA CLÍNICA (MINSAL 164959) ---
        // ==========================================
        {
            id: 's_podo_basica',
            categoryId: 'podologia',
            categoryGroup: 'podologia',
            name: 'Podología Clínica Básica',
            price: 20000,
            duration: 45,
            description: 'Desde $20.000. Atención podológica general por Priscila Villarreal (Podóloga MINSAL 164959): limpieza, corte y cuidado de uñas, retiro de durezas y evaluación del pie.',
            adicionales: 'Atención certificada por el MINSAL con materiales esterilizados',
            recommendedFor: ['bienestar', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_podo_hongos',
            categoryId: 'podologia',
            categoryGroup: 'podologia',
            name: 'Podología + Tratamiento para Hongos',
            price: 23000,
            duration: 60,
            description: 'Desde $23.000. Incluye limpieza podológica clínica y aplicación de tratamiento específico para hongos (varía según cantidad de uñas y grado de afección).',
            adicionales: 'Procedimiento podológico clínico individualizado',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_podo_encarnada_sencillo',
            categoryId: 'podologia',
            categoryGroup: 'podologia',
            name: 'Tratamiento Uña Encarnada (Caso Sencillo)',
            price: 25000,
            duration: 45,
            description: 'Uña encarnada localizada, enrojecimiento e inflamación leve, dolor moderado, sin secreción ni tejido de granulación. Incluye procedimiento y control inicial.',
            adicionales: 'Procedimiento profesional clínico indoloro',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1583001809873-a128495da465?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_podo_encarnada_medio',
            categoryId: 'podologia',
            categoryGroup: 'podologia',
            name: 'Tratamiento Uña Encarnada (Complejidad Media)',
            price: 28000,
            duration: 60,
            description: 'Mayor inflamación y dolor, puede presentar secreción (pus), inicio de tejido de granulación, aumento de rodete ungueal. Incluye procedimiento y control inicial.',
            adicionales: 'Manejo clínico cuidadoso y curación',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_podo_encarnada_complejo',
            categoryId: 'podologia',
            categoryGroup: 'podologia',
            name: 'Tratamiento Uña Encarnada (Caso Complejo)',
            price: 30000,
            duration: 75,
            description: 'Uña profundamente encarnada, presencia de tejido de granulación (granuloma), inflamación importante y secreción persistente. Incluye manejo cuidadoso y controles posteriores.',
            adicionales: 'Tratamiento avanzado y seguimiento clínico',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },

        // ==========================================
        // --- DEPILACIÓN FEMENINA (Cera Hipoalergénica) ---
        // ==========================================
        {
            id: 's_dep_fem_pierna_comp',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Pierna Completa (Femenina)',
            price: 15000,
            duration: 45,
            description: 'Desde muslo a tobillo. Cera de abeja hipoalergénica: menos irritación, más suavidad, apta para pieles sensibles.',
            adicionales: 'Resultados más duraderos y piel suave',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_media_pierna',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Media Pierna (Femenina)',
            price: 7000,
            duration: 25,
            description: 'Desde rodilla a tobillo con cera de abeja hipoalergénica.',
            adicionales: 'Suave con tu piel, cuida y protege',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_brazo_comp',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Brazo Completo (Femenina)',
            price: 13000,
            duration: 30,
            description: 'Depilación completa de brazos con cera hipoalergénica suave.',
            adicionales: 'Menos irritación',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_medio_brazo',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Medio Brazo (Femenina)',
            price: 6000,
            duration: 20,
            description: 'Depilación de medio brazo con cera hipoalergénica.',
            adicionales: 'Apta para pieles sensibles',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_axila',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Axila (Femenina)',
            price: 5000,
            duration: 15,
            description: 'Piel suave, fresca y protegida con cera de abeja hipoalergénica.',
            adicionales: 'Materiales descartables higiénicos',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_rebaje_comp',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Rebaje Completo',
            price: 15000,
            duration: 35,
            description: 'Depilación íntima completa con cera de abeja hipoalergénica. Cuidado, privacidad y máxima suavidad.',
            adicionales: 'Apta para pieles sensibles',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_medio_rebaje',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Medio Rebaje',
            price: 10000,
            duration: 25,
            description: 'Depilación de medio rebaje / bikini con cera hipoalergénica.',
            adicionales: 'Resultados duraderos y limpios',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_rostro',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Rostro Completo (Femenina)',
            price: 10000,
            duration: 30,
            description: 'Depilación facial completa con cera suave hipoalergénica. Piel limpia, tersa y luminosa.',
            adicionales: 'Menos irritación para el rostro',
            recommendedFor: ['bienestar', 'evento'],
            image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_bozo',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Bozo',
            price: 5000,
            duration: 15,
            description: 'Eliminación suave del vello del labio superior con cera de abeja hipoalergénica.',
            adicionales: 'Procedimiento rápido e higiénico',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_cejas',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Cejas (Femenina)',
            price: 5000,
            duration: 20,
            description: 'Limpieza y perfilado de cejas con cera hipoalergénica.',
            adicionales: 'Enmarca tu mirada de forma natural',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1588510849202-3866299d6d84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_nariz',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Nariz (Femenina)',
            price: 5000,
            duration: 15,
            description: 'Eliminación higiénica de vello nasal.',
            adicionales: 'Cera hipoalergénica',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_oidos',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Oídos (Femenina)',
            price: 5000,
            duration: 15,
            description: 'Eliminación de vello en oídos.',
            adicionales: 'Rápido e higiénico',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_dep_fem_menton',
            categoryId: 'depilacion-femenina',
            categoryGroup: 'depilacion-femenina',
            name: 'Depilación Mentón',
            price: 3000,
            duration: 15,
            description: 'Eliminación de vello en zona del mentón con cera hipoalergénica.',
            adicionales: 'Suave y efectivo',
            recommendedFor: ['bienestar'],
            image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    ],

    // Profesionales
    professionals: [
        { id: 'p1', name: 'Nicolett', email: 'nicolette@gmail.com', role: 'admin', specialty: 'Especialista Integral & Fundadora', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80' },
        { id: 'p2', name: 'Camila', email: 'camila@gmail.com', role: 'profesional', specialty: 'Manicura & Mirada', avatar: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=150&q=80' },
        { id: 'p3', name: 'Priscila Villarreal', email: 'priscila@gmail.com', role: 'profesional', specialty: 'Podología Clínica (ROL MINSAL 164959)', avatar: 'https://images.unsplash.com/photo-1594824813583-0599a80b064c?auto=format&fit=crop&w=150&q=80' }
    ],

    gallery: [
        { id: 'g1', src: 'img/galeria1.jpg', title: 'Manicure Acrílica', serviceName: 'Manicure Acrílica', profesional: 'Camila', profId: 'p2' },
        { id: 'g2', src: 'img/galeria2.jpg', title: 'Lifting de Pestañas', serviceName: 'Lifting de Pestañas', profesional: 'Camila', profId: 'p2' },
        { id: 'g3', src: 'img/galeria3.jpg', title: 'Tratamiento Capilar', serviceName: 'Tratamiento Capilar', profesional: 'Nicolett', profId: 'p1' },
        { id: 'g4', src: 'img/galeria4.jpg', title: 'Maquillaje Profesional', serviceName: 'Maquillaje Profesional', profesional: 'Nicolett', profId: 'p1' },
        { id: 'g5', src: 'img/galeria5.jpg', title: 'Perfilado de Cejas', serviceName: 'Perfilado de Cejas', profesional: 'Camila', profId: 'p2' },
        { id: 'g6', src: 'img/galeria6.jpg', title: 'Pedicure Spa', serviceName: 'Pedicure Spa', profesional: 'Nicolett', profId: 'p1' }
    ],

    // Clientas Globales
    clients: [],

    // Inventario
    inventory: [
        { id: 'inv1', name: 'Esmalte Permanente Rojo', stock: 15, category: 'manos-pies' },
        { id: 'inv2', name: 'Pestañas Seda Curva C', stock: 50, category: 'mirada' },
        { id: 'inv3', name: 'Crema Masaje Capilar', stock: 8, category: 'capilar' },
        { id: 'inv4', name: 'Pegamento Pestañas', stock: 3, category: 'mirada' }
    ],

    // Horarios disponibles (simulados) - extendidos de 9 a 21 (cada 2 horas)
    timeSlots: [
        '09:00', '11:00', '13:00', '15:00',
        '17:00', '19:00', '21:00'
    ]
};

// Funciones para manejar localStorage y Firebase
const StorageHelper = {
    _appointmentsCache: [],
    _fichasCache: [],
    _professionalsCache: [],
    _inventoryCache: [],
    _flowConfigCache: null,

    init: async function () {
        if (!localStorage.getItem('nicolett_appointments')) {
            localStorage.setItem('nicolett_appointments', JSON.stringify([]));
        }
        await this.loadAppointmentsCache();
        
        if (!localStorage.getItem('nicolett_user')) {
            localStorage.setItem('nicolett_user', JSON.stringify({
                name: 'Cliente Prueba',
                phone: '+56912345678',
                email: 'cliente@test.com'
            }));
        }
        if (!localStorage.getItem('nicolett_auth')) {
            localStorage.setItem('nicolett_auth', JSON.stringify({ loggedIn: false, user: null }));
        }

        // Sincronizar estado de autenticación con Firebase
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    const profs = this.getProfessionals();
                    const prof = profs.find(p => p.email === user.email) || { id: 'p_unknown', name: 'Admin', role: 'admin' };
                    localStorage.setItem('nicolett_auth', JSON.stringify({ loggedIn: true, user: prof }));
                    
                    const btnLogout = document.getElementById('btn-logout');
                    if (btnLogout) btnLogout.style.display = 'block';
                    
                    // Si ya estamos en admin, refrescar la vista para mostrar los datos
                    this._refreshAdminIfSafe();
                } else {
                    localStorage.setItem('nicolett_auth', JSON.stringify({ loggedIn: false, user: null }));
                    
                    if(window.location.hash.includes('admin') && typeof AppRouter !== 'undefined') {
                        AppRouter.navigate('home');
                    }
                }
                if (typeof window.updateNavAuthVisibility === 'function') {
                    window.updateNavAuthVisibility();
                }
            });
        }
        
        if (!localStorage.getItem('nicolett_gallery_v2')) {
            localStorage.setItem('nicolett_gallery_v2', JSON.stringify(mockData.gallery));
        }
        if (!localStorage.getItem('nicolett_clients')) {
            localStorage.setItem('nicolett_clients', JSON.stringify(mockData.clients));
        }
    },

    _refreshAdminIfSafe: function() {
        if (typeof AppRouter !== 'undefined' && AppRouter.currentRoute === 'admin') {
            AppRouter.refresh();
        }
    },

    _getAppointmentKey: function(appt) {
        if (!appt) return null;
        if (appt.flowOrder) return `flow_order_${appt.flowOrder}`;
        if (appt.flowToken) return `flow_token_${appt.flowToken}`;
        if (appt.orderId) return `order_${appt.orderId}`;
        if (appt.date && appt.time) {
            const prof = (appt.profId || appt.profesional || '').toString().trim().toLowerCase();
            const client = (appt.clientEmail || appt.clientPhone || appt.clientName || '').toString().trim().toLowerCase();
            return `slot_${appt.date}_${appt.time}_${prof}_${client}`;
        }
        return appt.id || null;
    },

    getAppointments: function () {
        const seen = new Set();
        const unique = [];
        for (const a of this._appointmentsCache) {
            const key = this._getAppointmentKey(a) || a.id;
            if (key) {
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(a);
                }
            } else {
                unique.push(a);
            }
        }
        return unique;
    },

    getClientAppointments: function (email, phone) {
        const normEmail = (email || '').toString().trim().toLowerCase();
        const cleanPhone = (phone || '').toString().replace(/\D/g, '');

        if (!normEmail && !cleanPhone) return [];

        const all = this.getAppointments();
        const matches = all.filter(a => {
            if (!a) return false;
            // Coincidencia por correo normalizado
            if (normEmail && a.clientEmail && a.clientEmail.toString().trim().toLowerCase() === normEmail) {
                return true;
            }
            // Coincidencia por teléfono (últimos 8 dígitos para cubrir variaciones +569 / 9)
            if (cleanPhone && cleanPhone.length >= 8 && a.clientPhone) {
                const apptPhone = a.clientPhone.toString().replace(/\D/g, '');
                if (apptPhone && (apptPhone === cleanPhone || apptPhone.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(apptPhone.slice(-8)))) {
                    return true;
                }
            }
            return false;
        });

        // Ordenar de más reciente a más antigua
        matches.sort((a, b) => {
            const dateA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00'}`);
            const dateB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00'}`);
            return dateB - dateA;
        });

        return matches;
    },

    loadAppointmentsCache: async function() {
        if(typeof db === 'undefined') return;
        
        try {
            const querySnapshot = await db.collection("Citas").get();
            const appointments = [];
            const seenKeys = new Set();
            const duplicateDocIds = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const appt = { id: doc.id, ...data };
                const key = this._getAppointmentKey(appt);

                if (key && seenKeys.has(key)) {
                    console.warn(`[StorageHelper] Cita duplicada detectada: ${doc.id} (clave: ${key}). Omitiendo.`);
                    duplicateDocIds.push(doc.id);
                } else {
                    if (key) seenKeys.add(key);
                    appointments.push(appt);
                }
            });

            this._appointmentsCache = appointments;

            // Limpieza pasiva de citas duplicadas en Firestore si se encontraron (para sanar la base de datos)
            if (duplicateDocIds.length > 0) {
                console.log(`[StorageHelper] Limpiando ${duplicateDocIds.length} citas duplicadas en Firestore...`);
                duplicateDocIds.forEach(dupId => {
                    db.collection("Citas").doc(dupId).delete().catch(err => {
                        console.warn(`[StorageHelper] Error al eliminar duplicado ${dupId}:`, err);
                    });
                });
            }
        } catch(e) { console.error("Error cargando appointments:", e); }
        
        try {
            let fichasSnapshot = await db.collection("FichasClientas").get();
            // Fallback si la colección anterior FichasClinicas contiene datos históricos
            if (fichasSnapshot.empty) {
                try {
                    const legacySnap = await db.collection("FichasClinicas").get();
                    if (!legacySnap.empty) fichasSnapshot = legacySnap;
                } catch(err) {}
            }
            const fichas = [];
            fichasSnapshot.forEach((doc) => {
                fichas.push({ id: doc.id, ...doc.data() });
            });
            this._fichasCache = fichas;
        } catch(e) { console.error("Error cargando fichas clientas:", e); }
        
        try {
            const profsSnapshot = await db.collection("Profesionales").get();
            const profs = [];
            profsSnapshot.forEach((doc) => {
                profs.push({ id: doc.id, ...doc.data() });
            });
            this._professionalsCache = profs.length > 0 ? profs : [...mockData.professionals];
            // Asegurar que profesionales base (incluyendo podóloga clínica Priscila Villarreal) estén disponibles
            mockData.professionals.forEach(dp => {
                if (!this._professionalsCache.some(p => p.email === dp.email || p.id === dp.id)) {
                    this._professionalsCache.push(dp);
                }
            });
        } catch(e) { 
            console.error("Error cargando profesionales:", e); 
            if(this._professionalsCache.length === 0) this._professionalsCache = mockData.professionals;
        }
        
        try {
            const invSnapshot = await db.collection("Inventario").get();
            const inv = [];
            invSnapshot.forEach((doc) => {
                inv.push({ id: doc.id, ...doc.data() });
            });
            this._inventoryCache = inv.length > 0 ? inv : mockData.inventory;

            if (inv.length === 0 && typeof db !== 'undefined') {
                for (const item of mockData.inventory) {
                    const docData = { ...item };
                    delete docData.id;
                    try {
                        await db.collection("Inventario").doc(item.id).set(docData);
                    } catch(err) { console.error("Error inicializando inventario en FB:", err); }
                }
            }
        } catch(e) { 
            console.error("Error cargando inventario:", e); 
            if(this._inventoryCache.length === 0) this._inventoryCache = mockData.inventory;
        }

        try {
            const galSnapshot = await db.collection("Galeria").get();
            if (!galSnapshot.empty) {
                const currentGallery = this.getGallery();
                const existingIds = new Set(currentGallery.map(img => img.fbId || img.id));
                let addedAny = false;
                galSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (!existingIds.has(doc.id)) {
                        currentGallery.unshift({
                            id: doc.id,
                            fbId: doc.id,
                            ...data
                        });
                        addedAny = true;
                    }
                });
                if (addedAny) {
                    localStorage.setItem('nicolett_gallery_v2', JSON.stringify(currentGallery));
                }
            }
        } catch(e) {
            console.warn("Firestore Galeria (usando fallback local):", e);
        }

        try {
            const flowDoc = await db.collection("Configuracion").doc("flow").get();
            if (flowDoc.exists) {
                this._flowConfigCache = flowDoc.data();
                localStorage.setItem('nicolett_flow_config', JSON.stringify(this._flowConfigCache));
            }
        } catch(e) {
            console.warn("Firestore Configuracion Flow:", e);
        }

        this._refreshAdminIfSafe();
    },

    getAvailableTimeSlots: async function(date, profId) {
        if(typeof db === 'undefined') return mockData.timeSlots;

        try {
            const querySnapshot = await db.collection("Citas")
                .where("date", "==", date)
                .get();
            
            const bookedTimes = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                // Bloquear si pertenece a la profesional (o a cualquier si es un bloqueo general, pero por simplicidad al profId o profName)
                // Chequeo laxo por profId o profName
                if (data.profId === profId || data.profesional === profId || data.profesional === this.getProfessionals().find(p=>p.id===profId)?.name) {
                    if (data.status !== 'cancelada' && data.status !== 'no asiste') {
                        bookedTimes.push(data.time);
                    }
                }
            });
            
            return mockData.timeSlots.filter(t => !bookedTimes.includes(t));
        } catch (e) {
            console.error("Error obteniendo horas de Firebase:", e);
            return mockData.timeSlots;
        }
    },

    saveAppointment: async function (appointment) {
        appointment.status = appointment.status || 'confirmada';
        appointment.depositAmount = appointment.depositAmount || 5000;
        appointment.createdAt = new Date().toISOString(); // Fallback date

        const key = this._getAppointmentKey(appointment);

        // 1. Evitar duplicar en la memoria local si ya está presente
        if (key) {
            const existingIdx = this._appointmentsCache.findIndex(a => this._getAppointmentKey(a) === key);
            if (existingIdx >= 0) {
                console.warn("[StorageHelper] Cita ya presente en memoria local, actualizando:", this._appointmentsCache[existingIdx].id);
                this._appointmentsCache[existingIdx] = { ...this._appointmentsCache[existingIdx], ...appointment };
                return this._appointmentsCache[existingIdx];
            }
        }

        if(typeof db !== 'undefined') {
            try {
                // 2. Verificar en Firestore si ya existe un documento previo con la misma orden, token o slot
                let existingDocId = null;
                if (appointment.flowOrder || appointment.orderId || appointment.flowToken) {
                    const queries = [];
                    if (appointment.flowOrder) queries.push(db.collection("Citas").where("flowOrder", "==", appointment.flowOrder).limit(1).get());
                    if (appointment.orderId) queries.push(db.collection("Citas").where("orderId", "==", appointment.orderId).limit(1).get());
                    if (appointment.flowToken) queries.push(db.collection("Citas").where("flowToken", "==", appointment.flowToken).limit(1).get());

                    const snaps = await Promise.all(queries);
                    for (const snap of snaps) {
                        if (!snap.empty) {
                            existingDocId = snap.docs[0].id;
                            break;
                        }
                    }
                }

                if (!existingDocId && appointment.date && appointment.time) {
                    const snap = await db.collection("Citas")
                        .where("date", "==", appointment.date)
                        .where("time", "==", appointment.time)
                        .get();
                    snap.forEach(doc => {
                        const d = doc.data();
                        const matchProf = (d.profId === appointment.profId) || (d.profesional === appointment.profesional);
                        const matchClient = (d.clientEmail && d.clientEmail === appointment.clientEmail) ||
                                            (d.clientPhone && d.clientPhone === appointment.clientPhone) ||
                                            (d.clientName && d.clientName === appointment.clientName);
                        if (matchProf && matchClient && d.status !== 'cancelada') {
                            existingDocId = doc.id;
                        }
                    });
                }

                if (existingDocId) {
                    console.warn("[StorageHelper] Cita ya existe en Firestore con id:", existingDocId, "- Actualizando registro en vez de duplicar.");
                    appointment.id = existingDocId;
                    await db.collection("Citas").doc(existingDocId).set(appointment, { merge: true });
                    const idx = this._appointmentsCache.findIndex(a => a.id === existingDocId);
                    if (idx >= 0) {
                        this._appointmentsCache[idx] = { ...this._appointmentsCache[idx], ...appointment };
                    } else {
                        this._appointmentsCache.push(appointment);
                    }
                    return appointment;
                }

                // 3. Documento nuevo
                appointment.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                const docRef = await db.collection("Citas").add(appointment);
                appointment.id = docRef.id;
                this._appointmentsCache.push(appointment); // Update local cache
                return appointment;
            } catch (e) {
                console.error("Error guardando cita en Firebase (posible falta de permisos o reglas):", e);
                // Fallback to local storage if Firebase fails
                appointment.createdAt = new Date().toISOString(); // Reset to ISO string since serverTimestamp failed
                const appointments = JSON.parse(localStorage.getItem('nicolett_appointments') || '[]');
                appointment.id = 'appt_' + Date.now();
                appointments.push(appointment);
                localStorage.setItem('nicolett_appointments', JSON.stringify(appointments));
                this._appointmentsCache.push(appointment);
                return appointment;
            }
        } else {
            // Fallback to local storage if Firebase fails
            const appointments = JSON.parse(localStorage.getItem('nicolett_appointments') || '[]');
            appointment.id = 'appt_' + Date.now();
            appointments.push(appointment);
            localStorage.setItem('nicolett_appointments', JSON.stringify(appointments));
            this._appointmentsCache.push(appointment);
            return appointment;
        }
    },

    getUser: function () {
        return JSON.parse(localStorage.getItem('nicolett_user') || '{}');
    },

    saveUser: function (user) {
        localStorage.setItem('nicolett_user', JSON.stringify(user));
    },

    // Auth
    getAuth: function() {
        return JSON.parse(localStorage.getItem('nicolett_auth') || '{"loggedIn": false, "user": null}');
    },
    setAuth: function(authData) {
        localStorage.setItem('nicolett_auth', JSON.stringify(authData));
    },

    // Inventory
    getInventory: function() {
        return this._inventoryCache;
    },
    updateProductStock: async function(productId, amountUsed) {
        const inv = this.getInventory();
        const p = inv.find(x => x.id === productId);
        if(p && typeof db !== 'undefined') {
            p.stock = Math.max(0, p.stock - amountUsed);
            try {
                const docData = { ...p };
                delete docData.id;
                await db.collection("Inventario").doc(productId).set(docData, { merge: true });
            } catch(e) { console.error("Error updating stock", e); }
        }
    },
    updateProductStockDirect: async function(productId, newStock) {
        const inv = this.getInventory();
        const p = inv.find(x => x.id === productId);
        if(p) {
            p.stock = parseInt(newStock) || 0;
            if(typeof db !== 'undefined') {
                try {
                    const docData = { ...p };
                    delete docData.id;
                    await db.collection("Inventario").doc(productId).set(docData, { merge: true });
                } catch(e) { console.error("Error updating stock", e); }
            }
        }
    },
    addProduct: async function(product) {
        if(typeof db !== 'undefined') {
            try {
                const docRef = await db.collection("Inventario").add(product);
                product.id = docRef.id;
                this._inventoryCache.push(product);
                return product;
            } catch (e) { console.error("Error adding product", e); }
        }
    },

    updateAppointmentStatus: async function(id, newStatus) {
        if(typeof db !== 'undefined') {
            try {
                await db.collection("Citas").doc(id).update({ status: newStatus });
                const appIdx = this._appointmentsCache.findIndex(a => a.id === id);
                if (appIdx > -1) {
                    this._appointmentsCache[appIdx].status = newStatus;
                }
            } catch (e) {
                console.error("Error updating appointment status", e);
            }
        }
    },

    // Servicios y Categorías
    getServices: function() {
        return mockData.services;
    },
    getCategories: function() {
        return mockData.categories;
    },
    getServiceById: function(id) {
        return mockData.services.find(s => s.id === id) || null;
    },

    // Professionals
    getProfessionals: function() {
        return this._professionalsCache;
    },
    addProfessional: async function(prof) {
        if (!prof.id) {
            prof.id = 'p_' + Date.now();
        }
        if (typeof db !== 'undefined') {
            try {
                const docRef = await db.collection("Profesionales").add(prof);
                prof.id = docRef.id;
            } catch (e) {
                console.error("Error adding professional to Firestore", e);
            }
        }
        this._professionalsCache.push(prof);
        try {
            localStorage.setItem('nicolett_local_professionals', JSON.stringify(this._professionalsCache));
        } catch(e) {}
        return prof;
    },
    updateProfessional: async function(id, data) {
        const profIdx = this._professionalsCache.findIndex(p => p.id === id);
        if (profIdx > -1) {
            this._professionalsCache[profIdx] = { ...this._professionalsCache[profIdx], ...data };
        }
        if (typeof db !== 'undefined') {
            try {
                await db.collection("Profesionales").doc(id).set(data, { merge: true });
            } catch (e) {
                console.error("Error updating professional in Firestore", e);
            }
        }
        try {
            localStorage.setItem('nicolett_local_professionals', JSON.stringify(this._professionalsCache));
        } catch(e) {}
        return this._professionalsCache[profIdx];
    },
    deleteProfessional: async function(id) {
        if(typeof db !== 'undefined') {
            try {
                await db.collection("Profesionales").doc(id).delete();
            } catch (e) { console.error("Error deleting professional", e); }
        }
        this._professionalsCache = this._professionalsCache.filter(p => p.id !== id);
        try {
            localStorage.setItem('nicolett_local_professionals', JSON.stringify(this._professionalsCache));
        } catch(e) {}
    },

    // Staff Passwords Storage (para soporte offline y creación local de contraseñas)
    getStaffPasswords: function() {
        try {
            return JSON.parse(localStorage.getItem('nicolett_staff_passwords') || '{}');
        } catch(e) {
            return {};
        }
    },
    setStaffPassword: function(email, password) {
        if (!email || !password) return;
        const passes = this.getStaffPasswords();
        passes[email.trim().toLowerCase()] = password;
        try {
            localStorage.setItem('nicolett_staff_passwords', JSON.stringify(passes));
        } catch(e) {}
    },
    verifyStaffPassword: function(email, password) {
        if (!email || !password) return false;
        const normEmail = email.trim().toLowerCase();
        const passes = this.getStaffPasswords();
        const stored = passes[normEmail];
        if (stored && stored === password) return true;
        const validDefaults = ['admin123', '123456', 'Nicolett123!'];
        return validDefaults.includes(password);
    },

    // --- Gallery ---
    getGallery: function() {
        const stored = localStorage.getItem('nicolett_gallery_v2');
        if (stored) {
            try {
                const list = JSON.parse(stored);
                // Asegurar que las fotos iniciales tengan profesional si no lo tenían
                let changed = false;
                list.forEach(item => {
                    if (!item.profesional) {
                        const defaultMatch = mockData.gallery.find(d => d.id === item.id || d.title === item.title);
                        if (defaultMatch) {
                            item.profesional = defaultMatch.profesional || 'Nicolett Studio';
                            item.profId = defaultMatch.profId || '';
                            changed = true;
                        }
                    }
                });
                if (changed) {
                    localStorage.setItem('nicolett_gallery_v2', JSON.stringify(list));
                }
                return list;
            } catch(e) {}
        }
        
        // Inicializar con fotos aprobadas por defecto del estudio
        const initial = mockData.gallery.map(g => ({
            ...g,
            source: 'admin',
            approved: true,
            status: 'approved'
        }));
        localStorage.setItem('nicolett_gallery_v2', JSON.stringify(initial));
        return initial;
    },

    // Galería pública (solo fotos del estudio o fotos de clientas APROBADAS)
    getPublicGallery: function() {
        const gallery = this.getGallery();
        return gallery.filter(img => {
            // Si es de clienta, solo si está aprobada
            if (img.source === 'client') {
                return img.approved === true || img.status === 'approved';
            }
            // Si es de estudio/admin, visible por defecto a menos que se oculte explícitamente
            return img.approved !== false && img.status !== 'hidden';
        });
    },

    getClientGallery: function(email) {
        const gallery = this.getGallery();
        if (!email) return [];
        const normEmail = email.trim().toLowerCase();
        return gallery.filter(img => img.source === 'client' && img.clientEmail && img.clientEmail.trim().toLowerCase() === normEmail);
    },

    // Obtener fotos asociadas a una trabajadora específica (por nombre o id)
    getProfessionalGallery: function(profNameOrId) {
        if (!profNameOrId) return [];
        const norm = profNameOrId.toString().trim().toLowerCase();
        const gallery = this.getGallery();
        return gallery.filter(img => {
            const pName = (img.profesional || '').toString().trim().toLowerCase();
            const pId = (img.profId || '').toString().trim().toLowerCase();
            return pName === norm || pId === norm || pName.includes(norm) || norm.includes(pName);
        });
    },

    addGalleryImage: async function(imageObj) {
        const gallery = this.getGallery();
        imageObj.id = imageObj.id || ('g' + Date.now());
        imageObj.timestamp = imageObj.timestamp || Date.now();
        imageObj.date = imageObj.date || new Date().toLocaleDateString('es-CL');
        imageObj.profesional = imageObj.profesional || '';
        imageObj.profId = imageObj.profId || '';

        // Si la foto es subida por una clienta, queda PENDIENTE de aprobación
        const isClient = imageObj.source === 'client';
        imageObj.approved = isClient ? (imageObj.approved === true) : true;
        imageObj.status = isClient ? (imageObj.status || (imageObj.approved ? 'approved' : 'pending')) : 'approved';

        gallery.unshift(imageObj); // Agregar al principio
        localStorage.setItem('nicolett_gallery_v2', JSON.stringify(gallery));

        // Intento de persistencia en Firebase Firestore (asíncrono y resiliente)
        if (typeof db !== 'undefined') {
            try {
                const docData = {
                    title: imageObj.title || '',
                    src: imageObj.src,
                    serviceName: imageObj.serviceName || '',
                    clientName: imageObj.clientName || '',
                    clientEmail: imageObj.clientEmail || '',
                    profesional: imageObj.profesional || '',
                    profId: imageObj.profId || '',
                    source: imageObj.source || 'admin',
                    approved: imageObj.approved,
                    status: imageObj.status,
                    date: imageObj.date,
                    createdAt: (typeof firebase !== 'undefined' && firebase.firestore) 
                        ? firebase.firestore.FieldValue.serverTimestamp() 
                        : new Date().toISOString()
                };
                const docRef = await db.collection("Galeria").add(docData);
                imageObj.fbId = docRef.id;
            } catch(e) {
                console.warn("Firestore Galeria add error (usando local):", e);
            }
        }

        return imageObj;
    },

    // Aprobar o Desaprobar/Ocultar foto en Galería Pública (Solo Administradora)
    setGalleryImageApproval: async function(id, approved) {
        const gallery = this.getGallery();
        const img = gallery.find(item => item.id === id || item.fbId === id);
        if (!img) return null;

        img.approved = !!approved;
        img.status = approved ? 'approved' : 'pending';
        localStorage.setItem('nicolett_gallery_v2', JSON.stringify(gallery));

        if (typeof db !== 'undefined') {
            try {
                const docId = img.fbId || (img.id && !img.id.startsWith('g') ? img.id : null);
                if (docId) {
                    await db.collection("Galeria").doc(docId).set({
                        approved: img.approved,
                        status: img.status
                    }, { merge: true });
                }
            } catch(e) {
                console.warn("Firestore Galeria update approval error:", e);
            }
        }
        return img;
    },

    deleteGalleryImage: async function(id) {
        let gallery = this.getGallery();
        const imgToDelete = gallery.find(img => img.id === id || img.fbId === id);
        gallery = gallery.filter(img => img.id !== id && img.fbId !== id);
        localStorage.setItem('nicolett_gallery_v2', JSON.stringify(gallery));

        if (typeof db !== 'undefined' && imgToDelete) {
            try {
                const docId = imgToDelete.fbId || (imgToDelete.id && !imgToDelete.id.startsWith('g') ? imgToDelete.id : null);
                if (docId) {
                    await db.collection("Galeria").doc(docId).delete();
                }
            } catch (e) {
                console.warn("Firestore Galeria delete error:", e);
            }
        }
    },

    // Fichas Clientas
    getFichas: function() {
        return this._fichasCache || [];
    },
    saveFicha: async function(ficha) {
        if(typeof db !== 'undefined') {
            try {
                ficha.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                const docRef = await db.collection("FichasClientas").add(ficha);
                ficha.id = docRef.id;
                this._fichasCache.push(ficha);
            } catch (e) {
                console.error("Error guardando ficha clienta en Firebase (posible falta de permisos o reglas):", e);
                // Fallback
                ficha.id = 'ficha_' + Date.now();
                ficha.createdAt = new Date().toISOString();
                this._fichasCache.push(ficha);
            }
        } else {
            // Fallback
            ficha.id = 'ficha_' + Date.now();
            this._fichasCache.push(ficha);
        }
    },
    deleteFicha: async function(id) {
        if(typeof db !== 'undefined') {
            try {
                await db.collection("FichasClientas").doc(id).delete();
                try { await db.collection("FichasClinicas").doc(id).delete(); } catch(err){}
                this._fichasCache = this._fichasCache.filter(f => f.id !== id);
            } catch (e) {
                console.error("Error eliminando ficha clienta:", e);
            }
        } else {
            this._fichasCache = this._fichasCache.filter(f => f.id !== id);
        }
    },

    // --- Clientas Globales y CRM ---
    getClients: function() {
        return JSON.parse(localStorage.getItem('nicolett_clients') || '[]');
    },
    saveClients: function(clients) {
        localStorage.setItem('nicolett_clients', JSON.stringify(clients));
    },
    addClient: function(client) {
        const clients = this.getClients();
        const normEmail = (client.email || '').toString().trim().toLowerCase();
        const cleanPhone = (client.phone || '').toString().replace(/\D/g, '');

        // Evitar duplicar clientas en el listado CRM
        const existingIndex = clients.findIndex(c => {
            if (normEmail && c.email && c.email.toString().trim().toLowerCase() === normEmail) return true;
            if (cleanPhone && cleanPhone.length >= 8 && c.phone && c.phone.toString().replace(/\D/g, '').endsWith(cleanPhone.slice(-8))) return true;
            return false;
        });

        if (existingIndex !== -1) {
            clients[existingIndex] = {
                ...clients[existingIndex],
                ...client,
                id: clients[existingIndex].id
            };
            this.saveClients(clients);
            return clients[existingIndex];
        }

        client.id = client.id || ('client_' + Date.now());
        clients.push(client);
        this.saveClients(clients);
        return client;
    },
    updateClient: function(updatedClient) {
        let clients = this.getClients();
        const index = clients.findIndex(c => c.id === updatedClient.id);
        if(index !== -1) {
            clients[index] = updatedClient;
            this.saveClients(clients);
        }
    },
    deleteClient: function(id) {
        let clients = this.getClients();
        clients = clients.filter(c => c.id !== id);
        this.saveClients(clients);
    },

    // --- Gestión de Perfil de Clienta (Autenticación e Historial) ---
    getOrCreateClientProfile: async function(rawEmail, rawName, rawPhone) {
        const email = (rawEmail || '').toString().trim().toLowerCase();
        let name = (rawName || '').toString().trim();
        let phone = (rawPhone || '').toString().trim();

        if (!email) {
            throw new Error('El correo electrónico es requerido.');
        }

        let existingDoc = null;
        let existingDocId = null;

        if (typeof db !== 'undefined' && db && typeof db.collection === 'function') {
            try {
                // 1. Buscar en perfil_cliente por correo normalizado en minúsculas
                let snapshot = await db.collection('perfil_cliente').where('email', '==', email).get();

                // 2. Si no se encontró por minúsculas, probar con el texto original sin modificar mayúsculas
                if (snapshot.empty && rawEmail && rawEmail.trim() !== email) {
                    snapshot = await db.collection('perfil_cliente').where('email', '==', rawEmail.trim()).get();
                }

                // 3. Fallback de búsqueda case-insensitive recorriendo los perfiles si aún no se encuentra
                if (snapshot.empty) {
                    const allSnap = await db.collection('perfil_cliente').get();
                    allSnap.forEach(doc => {
                        const data = doc.data();
                        if (!existingDoc && data.email && data.email.toString().trim().toLowerCase() === email) {
                            existingDoc = data;
                            existingDocId = doc.id;
                        }
                    });
                } else {
                    const doc = snapshot.docs[0];
                    existingDoc = doc.data();
                    existingDocId = doc.id;
                }
            } catch (err) {
                console.warn('[StorageHelper] Error consultando perfil_cliente en Firestore:', err);
            }
        }

        // Si el perfil ya existe en Firestore
        if (existingDoc && existingDocId) {
            console.log(`[StorageHelper] Perfil existente encontrado en Firestore (ID: ${existingDocId}) para ${email}. No se creará duplicado.`);
            const finalName = name || existingDoc.name || 'Clienta';
            const finalPhone = phone || existingDoc.phone || '';

            // Actualización no destructiva en Firestore si se aportó nombre o teléfono
            if (typeof db !== 'undefined' && db && typeof db.collection === 'function') {
                const updates = { email: email };
                if (name && (!existingDoc.name || existingDoc.name === 'Clienta')) updates.name = name;
                if (phone && !existingDoc.phone) updates.phone = phone;

                try {
                    await db.collection('perfil_cliente').doc(existingDocId).set(updates, { merge: true });
                } catch(e) {}
            }

            const profile = {
                id: existingDocId,
                name: finalName,
                email: email,
                phone: finalPhone,
                isExisting: true
            };

            localStorage.setItem('nicolett_personalization', JSON.stringify({
                name: profile.name,
                email: profile.email,
                phone: profile.phone
            }));

            return profile;
        }

        // Si NO existe en perfil_cliente, buscar si tiene citas agendadas previas para rescatar su nombre
        const clientAppts = this.getClientAppointments(email, phone);
        if (!name && clientAppts.length > 0 && clientAppts[0].clientName) {
            name = clientAppts[0].clientName.trim();
        }
        if (!phone && clientAppts.length > 0 && clientAppts[0].clientPhone) {
            phone = clientAppts[0].clientPhone.trim();
        }

        const finalName = name || 'Clienta';
        const finalPhone = phone || '';

        // Crear registro único en Firestore
        let newDocId = 'cli_' + Date.now();
        if (typeof db !== 'undefined' && db && typeof db.collection === 'function') {
            try {
                const newDocRef = await db.collection('perfil_cliente').add({
                    name: finalName,
                    email: email,
                    phone: finalPhone,
                    createdAt: (typeof firebase !== 'undefined' && firebase.firestore) 
                        ? firebase.firestore.FieldValue.serverTimestamp() 
                        : new Date().toISOString()
                });
                newDocId = newDocRef.id;
                console.log(`[StorageHelper] Nuevo perfil_cliente creado en Firestore con ID: ${newDocId} para ${email}.`);
            } catch(err) {
                console.error('[StorageHelper] Error creando perfil_cliente:', err);
            }
        }

        const profile = {
            id: newDocId,
            name: finalName,
            email: email,
            phone: finalPhone,
            isExisting: false
        };

        localStorage.setItem('nicolett_personalization', JSON.stringify({
            name: profile.name,
            email: profile.email,
            phone: profile.phone
        }));

        return profile;
    },

    // --- Configuración de Flow (Pasarela de Pago de Abonos) ---
    getFlowConfig: function() {
        if (this._flowConfigCache) return this._flowConfigCache;
        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
        const defaultBackend = isLocal ? 'http://localhost:3000' : (typeof window !== 'undefined' ? window.location.origin : '');
        const def = {
            flowUrl: '',
            apiKey: '',
            secretKey: '',
            backendUrl: defaultBackend,
            isSandbox: true
        };
        try {
            const stored = localStorage.getItem('nicolett_flow_config');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.flowUrl && parsed.flowUrl.includes('abono5000')) {
                    parsed.flowUrl = '';
                }
                // Si estamos en Vercel/producción y quedó guardado localhost:3000, usar el dominio actual
                if (!isLocal && (!parsed.backendUrl || parsed.backendUrl.includes('localhost') || parsed.backendUrl.includes('127.0.0.1'))) {
                    parsed.backendUrl = defaultBackend;
                }
                this._flowConfigCache = { ...def, ...parsed };
            } else {
                this._flowConfigCache = def;
            }
        } catch(e) {
            this._flowConfigCache = def;
        }
        return this._flowConfigCache;
    },

    saveFlowConfig: async function(cfg) {
        this._flowConfigCache = cfg;
        localStorage.setItem('nicolett_flow_config', JSON.stringify(cfg));
        if (typeof db !== 'undefined') {
            try {
                await db.collection("Configuracion").doc("flow").set(cfg, { merge: true });
            } catch(e) {
                console.error("Error guardando configuración de Flow en Firestore:", e);
            }
        }
        return cfg;
    }
};

StorageHelper.init();
