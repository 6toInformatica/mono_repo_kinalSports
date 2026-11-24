# Código de Conducta (`CODE_OF_CONDUCT.md`)

**KinalSports · Fundación Kinal · Sexto Perito en Computación**

---

## 1. Presentación y Naturaleza del Documento

Este Código de Conducta establece las expectativas de convivencia, colaboración técnica, integridad académica y responsabilidad profesional para todas las personas que participan en el desarrollo, estudio, revisión y mantenimiento del monorepo **KinalSports**.

El proyecto se desarrolla en el marco formativo de **Sexto Perito en Computación** (`IN6AM` / `IN6AV`) de **[Fundación Kinal](https://www.kinal.org.gt/)**, institución educativa privada y no lucrativa en Guatemala cuya misión integra preparación técnica de alto nivel, desarrollo humano y servicio a la sociedad.

> **Alcance normativo:** Las reglas operativas descritas en este documento para el uso del repositorio, las revisiones de código y la infraestructura de desarrollo constituyen normas operativas propuestas para el proyecto **KinalSports**, no políticas institucionales oficiales aprobadas por **Fundación Kinal**, y **complementan —sin sustituir— los reglamentos internos y las disposiciones institucionales vigentes**.

---

## Índice de Navegación

1. [Presentación y Naturaleza del Documento](#1-presentación-y-naturaleza-del-documento)
2. [Principios Institucionales Aplicados al Desarrollo de Software](#2-principios-institucionales-aplicados-al-desarrollo-de-software)
3. [Integridad Académica y Profesional](#3-integridad-académica-y-profesional)
4. [Uso Responsable de Infraestructura y Recursos Compartidos](#4-uso-responsable-de-infraestructura-y-recursos-compartidos)
5. [Comunicación Técnica y Revisión de Código (_Code Review_)](#5-comunicación-técnica-y-revisión-de-código-code-review)
6. [Conductas Incompatibles con el Proyecto](#6-conductas-incompatibles-con-el-proyecto)
7. [Base Comunitaria: Contributor Covenant 2.1](#7-base-comunitaria-contributor-covenant-21)
8. [Aplicación, Seguimiento y Canales de Reporte](#8-aplicación-seguimiento-y-canales-de-reporte)

---

## 2. Principios Institucionales Aplicados al Desarrollo de Software

La identidad formativa de **[Fundación Kinal](https://www.kinal.org.gt/quienes-somos)** se fundamenta en cinco valores institucionales. En **KinalSports**, cada uno de estos valores se traduce en conductas técnicas y humanas concretas dentro del ciclo de vida del software:

### 2.1 Respeto a la Dignidad de la Persona

Toda interacción en el repositorio debe reconocer el valor intrínseco de cada estudiante, docente, revisor y colaborador:

- Mantener un trato respetuoso, cordial y profesional en comentarios de código, Issues, Pull Requests y sesiones de trabajo.
- **Criticar el código o el diseño técnico, nunca a la persona:** evaluar decisiones de arquitectura, manejo de errores o rendimiento con argumentos objetivos, sin descalificaciones personales.
- Reconocer explícitamente el esfuerzo, el progreso formativo y los aportes de los compañeros.
- Rechazar cualquier forma de acoso, burla, humillación, exclusión o discriminación.

### 2.2 Espíritu de Servicio

La ingeniería de software es una disciplina colaborativa en la que el conocimiento compartido fortalece a todo el equipo:

- Apoyar a los compañeros en la comprensión de la arquitectura, configuración de contenedores o resolución de fallos técnicos.
- Compartir hallazgos, documentación clara y buenas prácticas que faciliten el aprendizaje colectivo.
- Ayudar a otros integrantes a comprender y resolver problemas **sin sustituir su responsabilidad formativa ni apropiarse del trabajo ajeno**.
- Escribir código, mensajes de commit y guías pensando en quienes deberán leerlos y mantenerlos posteriormente.

### 2.3 Trabajo Bien Hecho

El compromiso con la excelencia técnica exige rigor y honestidad en cada entrega:

- Asumir plena responsabilidad sobre los cambios introducidos en el código, los esquemas de datos y la configuración.
- Entregar código legible, mantenible, coherente con la arquitectura del servicio (`auth-node`, `auth-service`, `server-admin`, `server-user` y clientes) y respaldado por pruebas verificables (`pnpm test`, `pnpm lint`).
- Documentar con fidelidad los componentes modificados sin inventar comportamientos ni ocultar limitaciones conocidas.
- **No presentar resultados no verificados, pruebas omitidas o código incompleto como si estuvieran terminados y validados.**

### 2.4 Libertad Personal Responsable

El entorno de desarrollo otorga autonomía técnica para analizar problemas y proponer soluciones, lo cual conlleva responsabilidad directa sobre las decisiones tomadas:

- Utilizar únicamente cuentas, ramas y permisos autorizados dentro del repositorio y de los entornos de laboratorio.
- Ejercer un uso ético, crítico y transparente de las herramientas de Inteligencia Artificial conforme a [`CONTRIBUTING.md`](./CONTRIBUTING.md).
- Proteger la información sensible, las credenciales de desarrollo y los datos del proyecto.
- Reconocer las consecuencias técnicas de cada cambio sobre los servicios compartidos (PostgreSQL, MongoDB, Redis, Cloudinary y Kinal Mail Hub) y asumir la corrección de los errores propios.

### 2.5 Visión Cristiana de la Vida

Se reconoce la **visión cristiana de la vida** como parte constitutiva de la identidad institucional de Fundación Kinal, proyectada en este entorno técnico y formativo a través del respeto a la dignidad humana, la honestidad intelectual, la rectitud en el actuar, la vocación de servicio y la búsqueda del bien común mediante el trabajo profesional bien realizado.

---

## 3. Integridad Académica y Profesional

El valor formativo de **KinalSports** depende de la veracidad y transparencia del trabajo realizado por cada participante. En todas las actividades vinculadas al repositorio se exige:

- **Respeto a la autoría:** Atribuir siempre el código, diseño, pruebas o documentación a quienes efectivamente los realizaron.
- **Rechazo al plagio:** No presentar código de otros compañeros, de repositorios externos o generado íntegramente por terceros como autoría propia sin la atribución y comprensión correspondientes.
- **Veracidad en pruebas y evidencias:** No falsificar salidas de consola, capturas de pantalla, reportes de cobertura ni snapshots de pruebas de contrato (`tests/contract`), ni deshabilitar aserciones para simular que una suite de pruebas pasa.
- **Transparencia ante defectos:** No ocultar deliberadamente errores relevantes, regresiones funcionales ni fallos de seguridad detectados durante el desarrollo.
- **Declaración honesta sobre asistencia de IA:** Cumplir las pautas de comprensión obligatoria, verificación empírica y declaración transparente definidas en la sección 8 de [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## 4. Uso Responsable de Infraestructura y Recursos Compartidos

Las siguientes normas operativas regulan el uso de los servicios, contenedores, bases de datos y cuentas vinculadas a **KinalSports**, sujetas a las disposiciones institucionales aplicables:

1. **Uso exclusivo de cuentas autorizadas:** Acceder a GitHub, bases de datos, paneles administrativos y servicios externos únicamente con las credenciales asignadas para la actividad.
2. **Respeto a permisos y límites de recursos:** No intentar eludir controles de acceso (`ADMIN_ROLE`, `x-internal-token`), límites de tasa (_Rate Limiting_) ni restricciones de red.
3. **Respeto a los espacios de otros equipos:** No acceder, modificar ni eliminar contenedores, bases de datos, ramas o configuraciones pertenecientes a otros estudiantes o equipos sin autorización explícita.
4. **Resguardo estricto de credenciales:** No compartir ni publicar en commits, Issues, Pull Requests o chats públicos contraseñas, `JWT_SECRET`, `INTERNAL_SERVICE_TOKEN`, `KMH_PROJECT_API_KEY` ni claves de Cloudinary.
5. **Integridad de servicios compartidos:** No alterar deliberadamente esquemas de PostgreSQL/MongoDB, claves de Redis ni configuraciones de Kinal Mail Hub en entornos compartidos de laboratorio.
6. **Prohibición de pruebas disruptivas sin autorización:** No ejecutar pruebas de estrés, denegación de servicio (DoS) ni escaneos agresivos que afecten la disponibilidad del laboratorio o de otros equipos.
7. **Reporte responsable de fallos de seguridad:** Cualquier vulnerabilidad detectada debe notificarse en privado siguiendo el protocolo de [`SECURITY.md`](./SECURITY.md), nunca exponiéndola públicamente ni explotándola.

---

## 5. Comunicación Técnica y Revisión de Código (_Code Review_)

Las revisiones de código y las discusiones técnicas son espacios de aprendizaje mutuo y aseguramiento de calidad:

- **Observaciones técnicas fundamentadas:** Explicar con claridad por qué se sugiere un cambio (por ejemplo, violación de Clean Architecture en `auth-service`, falta de invalidación de caché en Redis o riesgo de almacenamiento en `localStorage`), citando el archivo y proponiendo una mejora concreta.
- **Respeto durante el Code Review:** Evitar el sarcasmo, el tono punitivo o las expresiones despectivas ante errores de implementación.
- **Resolución constructiva de desacuerdos:** Cuando existan dos enfoques técnicos válidos, contrastarlos en función de la arquitectura real del monorepo, la simplicidad y la mantenibilidad, acatando la decisión final de los responsables técnicos del proyecto.
- **Disposición a aprender y corregir:** Recibir la retroalimentación con apertura profesional, reconocer los propios errores y aplicar las correcciones necesarias con diligencia.

---

## 6. Conductas Incompatibles con el Proyecto

Se consideran conductas incompatibles con la convivencia y la ética técnica de **KinalSports**:

- Acoso, intimidación, insultos o trato degradante en cualquier canal del proyecto.
- Discriminación por cualquier condición personal, social, académica o religiosa.
- Plagio, suplantación de autoría o apropiación indebida del trabajo de compañeros o terceros.
- Manipulación o falsificación de resultados de pruebas, logs o evidencias de funcionamiento.
- Exposición intencional o negligente de credenciales, tokens internos o información confidencial.
- Uso no autorizado de infraestructura, cuentas o servicios del laboratorio.
- Alteración deliberada de datos compartidos o sabotaje de ramas, contenedores o entornos de otros integrantes.
- Uso irresponsable de herramientas de Inteligencia Artificial que filtre secretos, introduzca código no verificado o sustituya fraudulentamente la evaluación técnica.

---

## 7. Base Comunitaria: Contributor Covenant 2.1

Además de las disposiciones contextualizadas para **KinalSports** y **Fundación Kinal** contenidas en las secciones 1 a 6, este repositorio adopta los principios base de convivencia e inclusión del **Contributor Covenant, versión 2.1**, cuyo texto de compromiso y estándares comunitarios se incorpora a continuación de forma diferenciada:

### 7.1 Compromiso Base (Contributor Covenant 2.1)

Nosotros, como miembros, contribuyentes y líderes, nos comprometemos a hacer de la participación en nuestra comunidad una experiencia libre de acoso para todo el mundo, independientemente de la edad, dimensión corporal, minusvalía visible o invisible, etnicidad, características sexuales, identidad y expresión de género, nivel de experiencia, educación, nivel socioeconómico, nacionalidad, apariencia personal, raza, casta, color, religión, u orientación e identidad sexual.

Nos comprometemos a actuar e interactuar de maneras que contribuyan a una comunidad abierta, acogedora, diversa, inclusiva y sana.

### 7.2 Estándares Comunitarios Base

Ejemplos de comportamiento que contribuyen a crear un ambiente positivo:

- Demostrar empatía y amabilidad ante otras personas.
- Respetar las diferentes opiniones, puntos de vista y experiencias.
- Dar y aceptar adecuadamente retroalimentación constructiva.
- Aceptar la responsabilidad y disculparse ante quienes se vean afectados por nuestros errores, aprendiendo de la experiencia.
- Centrarse en lo que sea mejor no solo para nosotros como individuos, sino para la comunidad en general.

Ejemplos de comportamiento inaceptable:

- El uso de lenguaje o imágenes sexualizadas, y aproximaciones o atenciones sexuales de cualquier tipo.
- Comentarios despectivos (_trolling_), insultos o derogatorios, y ataques personales o políticos.
- El acoso en público o privado.
- Publicar información privada de otras personas, tales como direcciones físicas o de correo electrónico, sin su permiso explícito.
- Otras conductas que puedan ser razonablemente consideradas como inapropiadas en un entorno profesional.

### 7.3 Atribución de Contributor Covenant

La sección 7 de este documento toma como base el [Contributor Covenant, versión 2.1](https://www.contributor-covenant.org/es/version/2/1/code_of_conduct.html). Las secciones 1 a 6 y 8 constituyen disposiciones específicas redactadas para el contexto formativo y técnico del monorepo **KinalSports** y no deben presentarse como texto oficial intacto de Contributor Covenant.

---

## 8. Aplicación, Seguimiento y Canales de Reporte

### 8.1 Gestión dentro del Repositorio

Los responsables técnicos y administradores del repositorio (`6toInformatica/mono_repo_kinalSports`) están facultados para revisar, solicitar correcciones, rechazar o retirar comentarios, commits, Issues o Pull Requests que incumplan los estándares técnicos, de seguridad o de convivencia descritos en este documento.

### 8.2 Prevalencia de Disposiciones Institucionales

Este documento no crea autoridades disciplinarias, tipificaciones legales ni sanciones académicas autónomas. Cuando una situación trascienda la gestión técnica del repositorio de GitHub y se relacione con la convivencia estudiantil o la integridad académica dentro de **Fundación Kinal**, **prevalecerán siempre los reglamentos, conductos y procedimientos institucionales aplicables**.

### 8.3 Canales de Comunicación

- **En el ámbito técnico del repositorio:** Comunicar cualquier situación directamente al responsable técnico del proyecto o a los administradores del repositorio en GitHub.
- **Canales institucionales formales:** _La designación de un correo electrónico específico o canal institucional formal para reportes derivados de este repositorio se encuentra pendiente de confirmación oficial._
