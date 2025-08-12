import { Club } from './types';

export const TARGET_DIMENSION = 120;

export const LEGENDS: { id: string; name: string }[] = [
    { id: '63480001', name: 'Zé Rato' },
    { id: '89040001', name: 'Rivazildo' },
    { id: '89040003', name: 'Victor Robles' },
    { id: '89040004', name: 'Jean Battiston' },
    { id: '89040005', name: 'Gianluca Gori' },
    { id: '89040006', name: 'Neil Morris' },
    { id: '89040007', name: 'M. Carlinhos' },
    { id: '89040008', name: 'Brian de Wit' },
    { id: '89040009', name: 'Ken Hughes' },
    { id: '89040010', name: 'Airton Junior' },
    { id: '89040011', name: 'Angel Medina' },
    { id: '89040012', name: 'Max Mineiro' },
    { id: '89040013', name: 'Ko Sun-hyuk' },
    { id: '89040015', name: 'Zuca Tigrão' },
    { id: '89040016', name: 'Julian Barreto' },
    { id: '89040017', name: 'Diego Cardenas' },
    { id: '89040018', name: 'Andrea Crimi' },
    { id: '89040019', name: 'Uwe Zieler' },
    { id: '89040020', name: 'Adam Kamiński' },
    { id: '89040021', name: 'George Willems' },
    { id: '89040022', name: 'Sam Alonso' },
    { id: '89040023', name: 'W. Poirreaux' },
    { id: '89040024', name: 'I. Narimán' },
    { id: '89040025', name: 'Chipi Guzmán' },
    { id: '89040026', name: 'N. Ganjavi' },
    { id: '89040027', name: 'Marcus Jagger' },
    { id: '89040028', name: 'R. Skonderoviç' },
    { id: '89040029', name: 'S. McHennicks' },
    { id: '89040030', name: 'Kloter Zhelino' },
    { id: '89040031', name: 'M. Panjaitani' },
    { id: '89040032', name: 'Saladin' },
    { id: '89040033', name: 'Raj Ramunajan' },
    { id: '89040034', name: 'J. L. González' },
    { id: '89040035', name: 'Sam Häyhänen' },
    { id: '89040036', name: 'H. Ayala' },
    { id: '89040037', name: 'V. Bakambi' },
    { id: '89040038', name: 'R. Chavo Pietro' },
    { id: '89040039', name: 'Xao Shuan' },
    { id: '89040040', name: 'Yuri Çalışkan' },
    { id: '89040041', name: 'Nkembi' },
    { id: '89040042', name: 'Lázaro' },
    { id: '89040043', name: 'Paco Yupanqui' }
];

export const CONTINENTS: Record<string, string> = {
    '1': 'Europa',
    '2': 'América do Sul',
    '3': 'América do Norte e Central',
    '4': 'Ásia',
    '5': 'África',
    '6': 'Oceânia'
};

export const CLUBS: Club[] = [
  {
    "id": "14",
    "name": "Dinamo City"
  },
  {
    "id": "15",
    "name": "Elbasani"
  },
  {
    "id": "16",
    "name": "Flamurtari Vlorë"
  },
  {
    "id": "19",
    "name": "KF Laçi"
  },
  {
    "id": "21",
    "name": "Partizani"
  },
  {
    "id": "23",
    "name": "KF Tirana"
  },
  {
    "id": "25",
    "name": "Apolonia Fier"
  },
  {
    "id": "26",
    "name": "Besa"
  },
  {
    "id": "28",
    "name": "Burreli"
  },
  {
    "id": "29",
    "name": "Bylis"
  },
  {
    "id": "32",
    "name": "Kastrioti"
  },
  {
    "id": "34",
    "name": "Lushnja"
  },
  {
    "id": "36",
    "name": "Pogradeci"
  },
  {
    "id": "38",
    "name": "Skënderbeu"
  },
  {
    "id": "40",
    "name": "Teuta"
  },
  {
    "id": "44",
    "name": "Vllaznia"
  },
  {
    "id": "45",
    "name": "Khroub"
  },
  {
    "id": "46",
    "name": "ASM Oran"
  },
  {
    "id": "47",
    "name": "ASO Chlef"
  },
  {
    "id": "49",
    "name": "CA Batna"
  },
  {
    "id": "51",
    "name": "Belouizdad"
  },
  {
    "id": "53",
    "name": "CS Constantine"
  },
  {
    "id": "54",
    "name": "ESM Mostaganem"
  },
  {
    "id": "55",
    "name": "ES Sétif"
  },
  {
    "id": "56",
    "name": "Kabylie"
  },
  {
    "id": "58",
    "name": "Skikda"
  },
  {
    "id": "59",
    "name": "MC Alger"
  },
  {
    "id": "61",
    "name": "MC Oran"
  },
  {
    "id": "62",
    "name": "MC Saïda"
  },
  {
    "id": "64",
    "name": "MO Constantine"
  },
  {
    "id": "66",
    "name": "NA Hussein Dey"
  },
  {
    "id": "67",
    "name": "Olympique Médéa"
  },
  {
    "id": "68",
    "name": "Paradou"
  },
  {
    "id": "69",
    "name": "Kouba"
  },
  {
    "id": "71",
    "name": "US Biskra"
  },
  {
    "id": "72",
    "name": "USM Alger"
  },
  {
    "id": "73",
    "name": "Annaba"
  },
  {
    "id": "76",
    "name": "El Harrach"
  },
  {
    "id": "79",
    "name": "Tlemcen"
  },
  {
    "id": "81",
    "name": "Atlètic d'Escaldes"
  },
  {
    "id": "86",
    "name": "Rànger's"
  },
  {
    "id": "88",
    "name": "FC Santa Coloma"
  },
  {
    "id": "89",
    "name": "Inter d'Escaldes"
  },
  {
    "id": "96",
    "name": "UE Santa Coloma"
  },
  {
    "id": "98",
    "name": "Boca Unidos"
  },
  {
    "id": "99",
    "name": "Argentinos Juniors"
  },
  {
    "id": "100",
    "name": "Arsenal"
  },
  {
    "id": "101",
    "name": "Atlético Rafaela"
  },
  {
    "id": "102",
    "name": "Aldosivi"
  },
  {
    "id": "103",
    "name": "All Boys"
  },
  {
    "id": "104",
    "name": "Banfield"
  },
  {
    "id": "105",
    "name": "CA Belgrano"
  },
  {
    "id": "106",
    "name": "Boca Juniors"
  },
  {
    "id": "107",
    "name": "Deportivo Merlo"
  },
  {
    "id": "108",
    "name": "Huracán"
  },
  {
    "id": "109",
    "name": "Independiente"
  },
  {
    "id": "110",
    "name": "Lanús"
  },
  {
    "id": "112",
    "name": "Patronato"
  },
  {
    "id": "113",
    "name": "Platense"
  },
  {
    "id": "114",
    "name": "River Plate"
  },
  {
    "id": "115",
    "name": "Rosario Central"
  },
  {
    "id": "116",
    "name": "Tigre"
  },
  {
    "id": "117",
    "name": "Atlético Tucumán"
  },
  {
    "id": "118",
    "name": "Ben Hur"
  },
  {
    "id": "119",
    "name": "Chacarita Juniors"
  },
  {
    "id": "120",
    "name": "Almirante Brown"
  },
  {
    "id": "121",
    "name": "Olimpo"
  },
  {
    "id": "122",
    "name": "Guillermo Brown"
  },
  {
    "id": "123",
    "name": "Desamparados"
  },
  {
    "id": "124",
    "name": "Colón"
  },
  {
    "id": "126",
    "name": "Defensa y Justicia"
  },
  {
    "id": "127",
    "name": "Estudiantes (LP)"
  },
  {
    "id": "128",
    "name": "Ferro Carril Oeste"
  },
  {
    "id": "129",
    "name": "Gimnasia (JU)"
  },
  {
    "id": "130",
    "name": "Gimnasia (LP)"
  },
  {
    "id": "131",
    "name": "Godoy Cruz"
  },
  {
    "id": "132",
    "name": "Atlanta"
  },
  {
    "id": "133",
    "name": "Indep. Rivadavia"
  },
  {
    "id": "134",
    "name": "Instituto"
  },
  {
    "id": "135",
    "name": "Newell's Old Boys"
  },
  {
    "id": "136",
    "name": "Quilmes"
  },
  {
    "id": "137",
    "name": "Racing Club"
  },
  {
    "id": "138",
    "name": "San Lorenzo"
  },
  {
    "id": "139",
    "name": "San Martín (SJ)"
  },
  {
    "id": "140",
    "name": "San Martín (T)"
  },
  {
    "id": "141",
    "name": "Talleres"
  },
  {
    "id": "143",
    "name": "Unión"
  },
  {
    "id": "144",
    "name": "Vélez Sarsfield"
  },
  {
    "id": "145",
    "name": "Ararat-Armenia"
  },
  {
    "id": "151",
    "name": "Gandzasar"
  },
  {
    "id": "156",
    "name": "Pyunik"
  },
  {
    "id": "158",
    "name": "Shirak"
  },
  {
    "id": "171",
    "name": "Adelaide"
  },
  {
    "id": "172",
    "name": "C. Coast Mariners"
  },
  {
    "id": "173",
    "name": "W. Sydney Wanderers"
  },
  {
    "id": "174",
    "name": "Melbourne Victory"
  },
  {
    "id": "175",
    "name": "Newcastle Jets"
  },
  {
    "id": "176",
    "name": "Melbourne City"
  },
  {
    "id": "177",
    "name": "Perth Glory"
  },
  {
    "id": "178",
    "name": "Brisbane Roar"
  },
  {
    "id": "179",
    "name": "Sydney"
  },
  {
    "id": "180",
    "name": "Wellington Phoenix"
  },
  {
    "id": "182",
    "name": "Leoben"
  },
  {
    "id": "189",
    "name": "Salzburg"
  },
  {
    "id": "190",
    "name": "Liefering"
  },
  {
    "id": "192",
    "name": "Admira"
  },
  {
    "id": "193",
    "name": "Austria Vienna"
  },
  {
    "id": "195",
    "name": "First Vienna"
  },
  {
    "id": "197",
    "name": "Kapfenberg"
  },
  {
    "id": "198",
    "name": "Wolfsberger"
  },
  {
    "id": "200",
    "name": "SCR Altach"
  },
  {
    "id": "202",
    "name": "Austria Klagenfurt"
  },
  {
    "id": "203",
    "name": "Rapid Wien"
  },
  {
    "id": "204",
    "name": "Sturm Graz"
  },
  {
    "id": "205",
    "name": "St. Pölten"
  },
  {
    "id": "209",
    "name": "Ried"
  },
  {
    "id": "211",
    "name": "Hartberg"
  },
  {
    "id": "212",
    "name": "Blau-Weiß"
  },
  {
    "id": "216",
    "name": "Qarabag"
  },
  {
    "id": "217",
    "name": "Karvan"
  },
  {
    "id": "221",
    "name": "Qäbälä"
  },
  {
    "id": "223",
    "name": "Sumgayit"
  },
  {
    "id": "224",
    "name": "Neftchi Baku"
  },
  {
    "id": "225",
    "name": "Turan"
  },
  {
    "id": "233",
    "name": "Al-Najma"
  },
  {
    "id": "237",
    "name": "Riffa"
  },
  {
    "id": "239",
    "name": "East Riffa"
  },
  {
    "id": "242",
    "name": "Manama"
  },
  {
    "id": "243",
    "name": "Muharraq"
  },
  {
    "id": "245",
    "name": "BATE Borisov"
  },
  {
    "id": "246",
    "name": "Belshyna"
  },
  {
    "id": "247",
    "name": "Slutsk"
  },
  {
    "id": "248",
    "name": "Dinamo Brest"
  },
  {
    "id": "249",
    "name": "Dinamo Minsk"
  },
  {
    "id": "250",
    "name": "Dinamo-Belkard"
  },
  {
    "id": "252",
    "name": "Baranovichi"
  },
  {
    "id": "253",
    "name": "Gomel"
  },
  {
    "id": "254",
    "name": "FC Minsk"
  },
  {
    "id": "256",
    "name": "Smorgon"
  },
  {
    "id": "258",
    "name": "Vitebsk"
  },
  {
    "id": "261",
    "name": "Klechesk Kletsk"
  },
  {
    "id": "264",
    "name": "Partizan Minsk"
  },
  {
    "id": "265",
    "name": "Slavia Mozyr"
  },
  {
    "id": "266",
    "name": "Naftan"
  },
  {
    "id": "267",
    "name": "Neman"
  },
  {
    "id": "269",
    "name": "Shakhtyor Soligorsk"
  },
  {
    "id": "270",
    "name": "FC Minsk II"
  },
  {
    "id": "271",
    "name": "Torpedo Zhodino"
  },
  {
    "id": "275",
    "name": "Volna Pinsk"
  },
  {
    "id": "276",
    "name": "Energetik-BGU"
  },
  {
    "id": "277",
    "name": "KAA Gent"
  },
  {
    "id": "278",
    "name": "Antwerp"
  },
  {
    "id": "279",
    "name": "Cercle Brugge"
  },
  {
    "id": "280",
    "name": "Club Brugge"
  },
  {
    "id": "281",
    "name": "Dender"
  },
  {
    "id": "283",
    "name": "Vise"
  },
  {
    "id": "286",
    "name": "Tubize"
  },
  {
    "id": "287",
    "name": "Beerschot"
  },
  {
    "id": "288",
    "name": "Sint-Truidensem"
  },
  {
    "id": "291",
    "name": "Deinze"
  },
  {
    "id": "294",
    "name": "Kortrijk"
  },
  {
    "id": "295",
    "name": "Mechelen"
  },
  {
    "id": "296",
    "name": "Oostende"
  },
  {
    "id": "298",
    "name": "Tienen"
  },
  {
    "id": "299",
    "name": "Lommel"
  },
  {
    "id": "300",
    "name": "Lierse"
  },
  {
    "id": "301",
    "name": "Olympic Charleroi"
  },
  {
    "id": "302",
    "name": "OH Leuven"
  },
  {
    "id": "303",
    "name": "Mons"
  },
  {
    "id": "304",
    "name": "RFC Liège"
  },
  {
    "id": "305",
    "name": "Anderlecht"
  },
  {
    "id": "306",
    "name": "Genk"
  },
  {
    "id": "308",
    "name": "SK Beveren"
  },
  {
    "id": "309",
    "name": "Cappellen"
  },
  {
    "id": "312",
    "name": "Zulte Waregem"
  },
  {
    "id": "313",
    "name": "Charleroi"
  },
  {
    "id": "314",
    "name": "Lokeren"
  },
  {
    "id": "315",
    "name": "Standard Liège"
  },
  {
    "id": "316",
    "name": "KAS Eupen"
  }
]
