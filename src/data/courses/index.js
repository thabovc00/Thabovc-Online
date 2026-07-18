// src/data/courses/index.js
import { appliedProgrammingData } from "./digital-business/applied-programming";
import { englishCommunicationData } from "./english/english-communication"; 
import { healthSafetyData } from "./hospital-business/health-safety"; 
import { sustainableDevelopmentData } from "./general/sustainable-development"; 
import { basicBusinessData } from "./marketing/basic-business"; 
import { computerOSData } from "./digital-business/computer-os"; 
import { wordProcessingData } from "./digital-business/word-processing"; 
import { computerMaintenanceData } from "./digital-business/computer-maintenance"; 
import { industrialMaterialsData } from "./automotive/industrial-materials"; 
import { basicMachineToolsData } from "./automotive/basic-machine-tools"; 
import { weldingSheetMetalData } from "./automotive/welding-and-sheet-metal"; 
import { fuelsLubricantsData } from "./automotive/fuels-and-lubricants"; 
import { smallEnginesData } from "./automotive/small-engines"; 
import { carServiceData } from "./automotive/car-service"; 
import { motorcycleMechanicData } from "./automotive/motorcycle-mechanic"; 
import { digitalTechForCareerData } from "./digital-business/digital-tech-for-career"; 
import { basicTechnicalDrawingData } from "./general/basic-technical-drawing"; 
import { basicElectricalData } from "./electrical/basic-electrical-electronics"; 
import { dcCircuitsData } from "./electrical/dc-circuits"; 
import { buildingElectricalInstallationData } from "./electrical/building-electrical-installation"; 
import { lightingDesignData } from "./electrical/lighting-design"; 
import { vocationalScienceData } from "./general/vocational-science"; 
import { civicsAndEthicsData } from "./general/civics-and-ethics"; 
import { anatomyPhysiologyData } from "./hospital-business/anatomy-and-physiology"; 
import { appliedScienceHealthData } from "./hospital-business/applied-science-health-business"; 
import { healthcareServiceSafetyData } from "./hospital-business/healthcare-service-safety"; 
import { healthEduDegenerationData } from "./hospital-business/health-education-physical-degeneration"; 
import { businessMathematicsData } from "./hospital-business/business-mathematics"; // 1. import จากพาร์ทใหม่
import { thaiHistoryData } from "./general/thai-history";
import { basicSellingMarketingData } from "./marketing/basic-selling-marketing";
import { basicAccountingData } from "./accounting/basic-accounting";
import { digitalThaiTypingData } from "./accounting/digital-thai-typing"; // 1. import เพิ่มตรงนี้
import { merchandisingAccounting1Data } from "./accounting/accounting-for-merchandising-1"; // 1. import เพิ่มตรงนี้
import { merchandisingAccounting2Data } from "./accounting/accounting-for-merchandising-2";
import { internetEnglishData } from "./english/internet-english";
import { presentationProgramData } from "./digital-business/presentation-program";
import { computerNetworkData } from "./digital-business/computer-network";
import {mobileDevelopmentData} from "./digital-business/mobile-development";
import {computerMathData} from "./digital-business/computer-math";
import {businessThaiData} from "./general/business-thai";
import {physicalEducationData} from "./general/physical-education";
import {basicOccupationalMathData} from "./general/basic-occupational-math";
import {carUnderbodyData} from "./automotive/car-underbody";
import {powerTransmissionData} from "./automotive/power-transmission";
import {mechanicalMechanicsData} from "./automotive/mechanical-mechanics";
import {motorcycleSafetyData} from "./automotive/motorcycle-safety";
import {industrialEnglishData} from "./english/industrial-english";
import {refrigerationData} from "./electrical/refrigeration";
import {acMotorData} from "./electrical/ac-motor";
import {energyManagementData} from "./electrical/energy-management";
import {acGeneratorData } from "./electrical/ac-generator";
import {powerElectronicsData} from "./electrical/power-electronics";
import { laborLawData } from "./general/labor-law"; // 1. import เพิ่มตรงนี้
import { firstAidServiceData } from "./hospital-business/first-aid-service"; // 2. import เพิ่มตรงนี้
import {medicalEquipmentData} from "./hospital-business/medical-equipment"; // 3. import เพิ่มตรงนี้
import {thaiCommunicationData} from "./general/thai-communication"; // 4. import เพิ่มตรงนี้
export const courses = [
  
  appliedProgrammingData,
  englishCommunicationData, 
  healthSafetyData,
  sustainableDevelopmentData,
  basicBusinessData,
  computerOSData,
  wordProcessingData,
  computerMaintenanceData,
  industrialMaterialsData,
  basicMachineToolsData,
  weldingSheetMetalData,
  fuelsLubricantsData,
  smallEnginesData,
  carServiceData,
  motorcycleMechanicData,
  digitalTechForCareerData,
  basicTechnicalDrawingData,
  basicElectricalData, 
  dcCircuitsData, 
  buildingElectricalInstallationData, 
  lightingDesignData, 
  vocationalScienceData, 
  civicsAndEthicsData, 
  anatomyPhysiologyData, 
  appliedScienceHealthData, 
  healthcareServiceSafetyData, 
  healthEduDegenerationData, 
  businessMathematicsData, // 2. เพิ่มเข้ามาในอาร์เรย์หลัก
  thaiHistoryData, // 3. เพิ่มเข้ามาในอาร์เรย์หลัก
  basicSellingMarketingData, // 4. เพิ่มเข้ามาในอาร์เรย์หลัก
  basicAccountingData, // 5. เพิ่มเข้ามาในอาร์เรย์หลัก  
  digitalThaiTypingData, // 6. เพิ่มเข้ามาในอาร์เรย์หลัก
  merchandisingAccounting1Data, // 7. เพิ่มเข้ามาในอาร์เรย์หลัก
  merchandisingAccounting2Data, // 8. เพิ่มเข้ามาในอาร์เรย์หลัก
  internetEnglishData, // 9. เพิ่มเข้ามาในอาร์เรย์หลัก
  presentationProgramData, // 10. เพิ่มเข้ามาในอาร์เรย์หลัก
  computerNetworkData, // 11. เพิ่มเข้ามาในอาร์เรย์หลัก
  mobileDevelopmentData, // 12. เพิ่มเข้ามาในอาร์เรย์หลัก
  computerMathData, // 13. เพิ่มเข้ามาในอาร์เรย์หลัก
  businessThaiData, // 14. เพิ่มเข้ามาในอาร์เรย์หลัก
  physicalEducationData, // 15. เพิ่มเข้ามาในอาร์เรย์หลัก
  basicOccupationalMathData, // 16. เพิ่มเข้ามาในอาร์เรย์หลัก
  carUnderbodyData, // 17. เพิ่มเข้ามาในอาร์เรย์หลัก
  powerTransmissionData, // 18. เพิ่มเข้ามาในอาร์เรย์หลัก
  mechanicalMechanicsData, // 19. เพิ่มเข้ามาในอาร์เรย์หลัก
  motorcycleSafetyData, // 20. เพิ่มเข้ามาในอาร์เรย์หลัก
  industrialEnglishData, // 21. เพิ่มเข้ามาในอาร์เรย์หลัก
  refrigerationData, // 22. เพิ่มเข้ามาในอาร์เรย์หลัก
  acMotorData, // 23. เพิ่มเข้ามาในอาร์เรย์หลัก
  energyManagementData, // 24. เพิ่มเข้ามาในอาร์เรย์หลัก
  acGeneratorData, // 25. เพิ่มเข้ามาในอาร์เรย์หลัก
  powerElectronicsData, // 26. เพิ่มเข้ามาในอาร์เรย์หลัก
  laborLawData, // 27. เพิ่มเข้ามาในอาร์เรย์หลัก
  firstAidServiceData, // 28. เพิ่มเข้ามาในอาร์เรย์หลัก
  medicalEquipmentData, // 29. เพิ่มเข้ามาในอาร์เรย์หลัก
  thaiCommunicationData, // 30. เพิ่มเข้ามาในอาร์เรย์หลัก
];

export const categories = [
  { id: "all",        label: "ทั้งหมด",       icon: "⊞" },
  { id: "digital-business",       label: "เทคโนโลยีธุรกิจดิจิทัล",     icon: "💻" },
  { id: "accounting", label: "บัญชี", icon: "📊" },
  { id: "english",    label: "ภาษาต่างประเทศ",   icon: "🌐" },
  { id: "marketing",  label: "การตลาด",       icon: "📣" },
  { id: "automotive",  label: "ช่างยนต์",   icon: "🛠️" },
  { id: "electrical",  label: "ช่างไฟฟ้า",   icon: "⚡" },
  { id: "hospital-business", label: "ธุรกิจสถานพยาบาล", icon: "🏥" },
  { id: "general",      label: "วิชาสามัญ",           icon: "📚" },
];

export const levels = [
  { id: "all", label: "ทุกระดับชั้น" },
  { id: "ปวช.1", label: "ปวช.1" }, // ใช้ภาษาไทยเป็น id เลย
  { id: "ปวช.2", label: "ปวช.2" },
  { id: "ปวช.3", label: "ปวช.3" },
  { id: "ปวส.1", label: "ปวส.1" },
  { id: "ปวส.2", label: "ปวส.2" },
];
  