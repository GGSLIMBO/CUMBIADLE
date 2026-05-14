export interface Artist {
  id: number;
  name: string;
  genre: string;
  formationYear: number; // El año de tu lista (cuando se formó o explotó)
  aliases?: string[];
}

// El formato es importante: Nombre, renglón, "Género: ...", renglón, "Año: ...", renglón, Puntaje
const rawData = `
Angeles Azules
Género: Cumbia Sonidera
Año: 1976
90

Ke Personajes
Género: Cumbia Pop
Año: 2020
90

Aarón Y Su Grupo Ilusión
Género: Cumbia Colombiana
Año: 1996
86

Damas Gratis
Género: Cumbia Villera
Año: 2000
85

La T Y La M
Género: Cumbia Pop
Año: 2020
85

Rodrigo
Género: Cuarteto
Año: 1987
85

Leo Mattioli
Género: Cumbia Santafesina
Año: 2000
82

Angela Leiva
Género: Cumbia Romantica
Año: 2009
82

La Nueva Luna
Género: Cumbia Romantica
Año: 1995
82

Antonio Rios
Género: Cumbia Romantica
Año: 1995
82

Yerba Brava
Género: Cumbia Villera
Año: 2000
82

Gilda
Género: Cumbia Romantica
Año: 1992
82

Uriel Lozano
Género: Cumbia Santafesina
Año: 2008
82

Karina
Género: Cumbia Romantica
Año: 2004
82

Supermerk2
Género: Cumbia Villera
Año: 2002
82

Onda Sabanera
Género: Cumbia Colombiana
Año: 1998
82

Rayito Colombiano
Género: Cumbia Colombiana
Año: 1996
80

El Original
Género: Cumbia Villera
Año: 2001
80

Nene Malo
Género: Cumbia Base
Año: 2012
80

Rodrigo Tapari
Género: Cumbia Romantica
Año: 2017
80

La Mona Jiménez
Género: Cuarteto
Año: 1968
80

Amar Azul
Género: Cumbia 90s
Año: 1989
80

Ezequiel Y La Clave
Género: Cumbia Norteña
Año: 2006
78

Banda Xxi
Género: Cuarteto
Año: 1998
78

La Base
Género: Cumbia Base
Año: 2003
78

Dalila
Género: Cumbia Santafesina
Año: 1998
78

Daniel Agostini
Género: Cumbia Norteña
Año: 1997
78

Viru Kumbieron
Género: Cumbia Romantica
Año: 2015
78

Sebastián Mendoza
Género: Cumbia Norteña
Año: 2004
78

Grupo Red
Género: Cumbia Cachaca
Año: 1997
78

La Banda De Lechuga
Género: Cumbia Villera
Año: 2007
78

Los Turros
Género: Cumbia Base
Año: 2015
78

Los Charros
Género: Cumbia Romantica
Año: 1995
78

Nestor En Bloque
Género: Cumbia Base
Año: 2005
78

Hernan Y La Champions Liga
Género: Cumbia Base
Año: 2009
78

Pibes Chorros
Género: Cumbia Villera
Año: 2001
78

Jambao
Género: Cumbia Sonidera
Año: 1999
78

El Mago Y La Nueva
Género: Cumbia Romantica
Año: 2001
78

18 Kilates
Género: Cumbia Pop
Año: 2007
78

Mario Luis
Género: Cumbia Santafesina
Año: 2006
78

Los Angeles De Charly
Género: Cumbia Romantica
Año: 1999
75

Ráfaga
Género: Cumbia Romantica
Año: 1996
75

La Liga
Género: Cumbia Villera
Año: 2008
72

Los Del Palmar
Género: Cumbia Santafesina
Año: 1987
70

Los Palmeras
Género: Cumbia Santafesina
Año: 1970
70

Repiola
Género: Cumbia Villera
Año: 2003
70

Daniel Cardozo
Género: Cumbia Romantica
Año: 1995
70

Grupo Karos
Género: Cumbia Sonidera
Año: 1996
68

El Polaco
Género: Cumbia Base
Año: 2006
65

Los Sultanes
Género: Cumbia 90s
Año: 1992
65

El Traídor Y Los Pibes
Género: Cumbia Villera
Año: 2006
65

Walter Olmos
Género: Cuarteto
Año: 2000
65

Volcan
Género: Cumbia 90s
Año: 1996
65

La Repandilla
Género: Cumbia Villera
Año: 2004
65

Tambó Tambó
Género: Cumbia Santafesina
Año: 1998
65

Eh Guacho
Género: Cumbia Base
Año: 2003
65

El Pepo
Género: Cumbia Villera
Año: 2015
65

Meta Guacha
Género: Cumbia Villera
Año: 1999
65

Sonora Master
Género: Cumbia Colombiana
Año: 2017
65

El Villano
Género: Cumbia Urbana
Año: 2010
65

El Empuje
Género: Cumbia Villera
Año: 2006
65

El Dipy
Género: Cumbia Villera
Año: 2011
65

La Cumbia
Género: Cumbia Romantica
Año: 1997
65

Organización X
Género: Cumbia 90s
Año: 1996
65

Koli Arce
Género: Guaracha
Año: 1975
65

Ricky Maravilla
Género: Cumbia 80s
Año: 1976
65

Adrian Y Los Dados Negros
Género: Cumbia Norteña
Año: 1988
65

Mc Caco
Género: Cumbia Villera
Año: 2008
65

Los Gedes
Género: Cumbia Villera
Año: 2002
65

El Perro
Género: Cumbia Villera
Año: 2008
65

La Rama
Género: Cumbia Villera
Año: 2004
65

El Retutu
Género: Cumbia Villera
Año: 2011
65

Chili Fernandez
Género: Cumbia Romantica
Año: 2003
65

Miguel Conejito Alejandro
Género: Cuarteto
Año: 1984
65

Karicia
Género: Cumbia Santafesina
Año: 1991
65

Puro Movimiento Dj
Género: Cumbia Base
Año: 2004
65

El Reja
Género: Cumbia Urbana
Año: 2012
65

Aclamado Amistad
Género: Cumbia Santafesina
Año: 1989
65

Los Dragones
Género: Cumbia Sureña
Año: 1998
65

De La Calle
Género: Cumbia Urbana
Año: 2010
65

Grupo Anaconda
Género: Cumbia Colombiana
Año: 2004
65

Marka Akme
Género: Cumbia Urbana
Año: 2014
65

La Piedra Urbana
Género: Cumbia Urbana
Año: 2012
65

Los Lamas
Género: Cumbia Santafesina
Año: 1981
65

Siete Lunas
Género: Cumbia Santafesina
Año: 1992
65

El Guachoon
Género: Cumbia Villera
Año: 2012
65

Lia Crucet
Género: Cumbia 80s
Año: 1980
65

Los Chicos De La Vía
Género: Cumbia Pop
Año: 2005
65

Gladys La Bomba Tucumana
Género: Cumbia 80s
Año: 1987
65

Los Nota Lokos
Género: Cumbia Base
Año: 2012
65

Tu Papa
Género: Cumbia Villera
Año: 2012
65

Grupo Sombras
Género: Cumbia Norteña
Año: 1988
65

Mala Fama
Género: Cumbia Villera
Año: 2000
65

Huguito Flores
Género: Guaracha
Año: 2017
65

Grupo Play
Género: Cumbia Pop
Año: 2004
65

Super Quinteto
Género: Guaracha
Año: 2003
65

Mario Pereyra
Género: Cumbia Santafesina
Año: 1988
65

Los Del Maranaho
Género: Cumbia Santafesina
Año: 1991
65

Grupo Cali
Género: Cumbia Santafesina
Año: 1994
65

Agrupación Marilyn
Género: Cumbia Base
Año: 2006
65

Trinidad
Género: Cumbia Santafesina
Año: 1983
65

Pala Ancha
Género: Cumbia Villera
Año: 2000
65

Malagata
Género: Cumbia Norteña
Año: 1990
62

Ezequiel El Brujo
Género: Cumbia Santafesina
Año: 1991
60

Coty Hernandez
Género: Cumbia Santafesina
Año: 1999
60

Altos Cumbieros
Género: Cumbia Villera
Año: 2003
60

Grupo Green
Género: Cumbia Cachaca
Año: 1980
60

Los Del Bohio
Género: Cumbia Santafesina
Año: 1978
60

Los Del Fuego
Género: Cumbia Santafesina
Año: 1984
60

Montana
Género: Cumbia Cachaca
Año: 1995
60

Alcides
Género: Cumbia 80s
Año: 1978
60

Granizo Rojo
Género: Cumbia Santafesina
Año: 1990
60

Diego Ríos
Género: Cumbia Romantica
Año: 2002
60

Simplemente Naguel
Género: Cumbia Santafesina
Año: 1991
60

Grupo Bandy2
Género: Cumbia Romantica
Año: 1997
58

Antho Mattei
Género: Cumbia Santafesina
Año: 2009
58

Mensajeros Del Amor
Género: Cumbia Cachaca
Año: 2001
58

Los Ávila
Género: Cumbia Romantica
Año: 1994
58

Mister Gato
Género: Cumbia 90s
Año: 1997
55

Media Naranja
Género: Cumbia Romantica
Año: 1998
55

El Arrebato
Género: Cumbia Base
Año: 2004
55

Escucha
Género: Cumbia Base
Año: 2004
55

Flor De Piedra
Género: Cumbia Villera
Año: 1999
55

Los Dora 2
Género: Cumbia Cachaca
Año: 1989
55

Cachumba
Género: Cuarteto
Año: 1997
55

Los Dinos
Género: Cumbia Santafesina
Año: 1989
55

El Stylo
Género: Cumbia Base
Año: 2006
55

Santa Marta
Género: Cumbia Colombiana
Año: 1998
55

Potencia
Género: Cumbia Romantica
Año: 1997
55

Walter Encina
Género: Cumbia Santafesina
Año: 1991
55

Corre Guachin
Género: Cumbia Villera
Año: 2004
55

Grupo Ternura
Género: Cumbia Norteña
Año: 1991
55

Los Chakales
Género: Cumbia Santafesina
Año: 1995
55

Los Clasiqueros
Género: Cumbia Pop
Año: 2004
55

Piola Vago
Género: Cumbia Villera
Año: 2005
55

Alejandro Veliz
Género: Guaracha
Año: 2000
55

Jimmy Y Su Combo Negro
Género: Cumbia Colombiana
Año: 2001
55

La Rosa
Género: Cumbia Romantica
Año: 1999
55

Medialunas
Género: Cumbia Santafesina
Año: 1995
55

Los Forasteros
Género: Cumbia Romantica
Año: 1996
55

Nolberto Al K La
Género: Cumbia Romantica
Año: 2001
55

Los Moykanos
Género: Cumbia Romantica
Año: 1997
55

Los Lirios
Género: Cumbia Santafesina
Año: 1987
55

Kalama Tropical
Género: Guaracha
Año: 1986
45

Mezgaya
Género: Cumbia Santafesina
Año: 2007
45

Guachin
Género: Cumbia Villera
Año: 1999
45

Marito
Género: Cumbia Base
Año: 2008
45

Jackita
Género: Cumbia Base
Año: 2009
45

Grupo Brumas
Género: Cumbia Romantica
Año: 1999
45

Elio
Género: Cumbia Cachaca
Año: 2000
45

Junior
Género: Cumbia Base
Año: 2005
45

Montecristo
Género: Cumbia Romantica
Año: 1999
45

Me Dicen Fideo
Género: Cumbia Villera
Año: 2010
45

Dedoberde
Género: Cumbia Base
Año: 2003
45

Luz Mala
Género: Cumbia Norteña
Año: 1995
45

Zacude
Género: Cumbia Villera
Año: 2000
45

Pocho La Pantera
Género: Cumbia 80s
Año: 1984
45

Dany Hoyos
Género: Guaracha
Año: 1990
45

Barra Box
Género: Cumbia Base
Año: 2011
45

Los Gorilas
Género: Cumbia 90s
Año: 1997
45

El Aspirante
Género: Cumbia Base
Año: 2015
45

Los Fantasmas Del Caribe
Género: Cumbia 90s
Año: 1991
45

Alazan
Género: Cumbia Romantica
Año: 1999
45

Jorge Veliz
Género: Guaracha
Año: 1980
45

Poca Plata
Género: Cumbia 90s
Año: 1997
45

Sonido Básico
Género: Cumbia Villera
Año: 2006
45

Zayana
Género: Cumbia Villera
Año: 2005
45

1 De Kal
Género: Cumbia Villera
Año: 2005
45

Dario Y Su Grupo Angora
Género: Cumbia Romantica
Año: 1991
45

La Maffia
Género: Cumbia 90s
Año: 1997
45

La Clave Norteña
Género: Cumbia Norteña
Año: 2004
45

Los Boy's
Género: Cumbia Cachaca
Año: 1996
45

Malakate
Género: Cumbia 90s
Año: 1996
45

Rocio Quiroz
Género: Cumbia Base
Año: 2013
45

Hernan Rodriguez
Género: Cumbia Norteña
Año: 2000
45

La Fuerza Joven
Género: Cumbia Santafesina
Año: 1997
45

El Gordo Luis
Género: Cumbia Santafesina
Año: 2009
45

Re Fantasma
Género: Cumbia Villera
Año: 2013
45

Gastón Angrisani
Género: Cumbia Romantica
Año: 2000
45

Magoman
Género: Cumbia Base
Año: 2005
45

Los Pibes Del Penal
Género: Cumbia Villera
Año: 2017
45

Daniel Lezica
Género: Cumbia Romantica
Año: 1991
45

Chaparral
Género: Cumbia Santafesina
Año: 1998
45

Noa Noa
Género: Cumbia Cachaca
Año: 2004
45

Comanche
Género: Cumbia 90s
Año: 1994
45

Sound De Barrio
Género: Cumbia Villera
Año: 2014
45

Pablo Sotelo
Género: Cumbia Romantica
Año: 2004
42

Almendrado
Género: Cumbia Norteña
Año: 1991
40

Chupetes
Género: Cumbia 90s
Año: 1992
40

Lore Y Roque Me Gusta
Género: Cumbia Pop
Año: 2007
40

Grupo Aventura
Género: Cumbia Romantica
Año: 2002
40

Grupo Cañaveral
Género: Cumbia Romantica
Año: 1995
40

Los Bybys
Género: Cumbia Romantica
Año: 1991
40

Amar Y Yo
Género: Cumbia Villera
Año: 2001
35

Bajo Palabra
Género: Cumbia Villera
Año: 2001
35

Grupo Uno
Género: Cumbia Romantica
Año: 2003
35

La Ihuana Mary
Género: Cumbia Villera
Año: 2005
35

Tinta Roja
Género: Cumbia Santafesina
Año: 1996
35

Grupo Chaja
Género: Cumbia Villera
Año: 2001
35

Sombras Nada Mas
Género: Cumbia Norteña
Año: 2021
35

Grupo Kalu
Género: Cumbia Villera
Año: 1999
35

Cumbieton
Género: Cumbia Base
Año: 2006
35

Pata De Lana
Género: Cumbia Villera
Año: 2001
31

Flashito Tumbero
Género: Cumbia Villera
Año: 2004
30

Grupo Contagio
Género: Cumbia Norteña
Año: 1997
30

Tus Guardianes
Género: Cumbia Romantica
Año: 2001
30

Los Manshynes
Género: Cumbia Base
Año: 2005
30

Grupo Blue
Género: Cumbia Cachaca
Año: 1998
30

Angie Y La Diferencia
Género: Cumbia 90s
Año: 1997
30

Cartucho Y Su Sonido
Género: Cumbia Villera
Año: 2005
30

Re Loco
Género: Cumbia Villera
Año: 2007
25

Los Yacansan
Género: Cumbia Villera
Año: 2001
25

Banda Luna
Género: Cumbia Base
Año: 2004
25

La Charanga
Género: Cumbia Norteña
Año: 1993
25

Baticantina
Género: Cumbia Villera
Año: 2003
25

Garras de Amor
Género: Cumbia Romántica
Año: 2000
25
`; 

// Esta función mágica convierte tu texto en objetos usables
export const getArtists = (): Artist[] => {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l !== '');
  const artists: Artist[] = [];
  
  // Tu lista tiene un patrón de 4 líneas por artista (Nombre, Género, Año, Puntaje)
  // Ojo: A veces los números 1, 2, 3... están intercalados. 
  // Para el MVP, vamos a asumir que limpiaste los números de ranking (1, 2...)
  
  let currentArtist: Partial<Artist> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('Género:')) {
      currentArtist.genre = line.replace('Género:', '').trim();
    } else if (line.startsWith('Año:')) {
      currentArtist.formationYear = parseInt(line.replace('Año:', '').trim());
    } else if (/^\d+$/.test(line) && parseInt(line) < 2026 && parseInt(line) > 1900) { 
        // Es un año suelto? No, es el puntaje (ej: 90). Lo ignoramos.
    } else if (/^\d+$/.test(line) && parseInt(line) < 500) {
        // Es el ranking (1, 2, 3...). Lo ignoramos.
    } else {
      // Si no es nada de lo anterior, es el NOMBRE
      if (currentArtist.name && currentArtist.genre && currentArtist.formationYear) {
         artists.push(currentArtist as Artist);
         currentArtist = {}; // Reset
      }
      currentArtist.name = line;
      currentArtist.id = artists.length + 1;
    }
  }
  
  // Push del último
  if (currentArtist.name && currentArtist.genre) {
      artists.push(currentArtist as Artist);
  }

  return artists;
};

// Exportamos la lista limpia
export const ARTISTS = getArtists();

const rodrigo = ARTISTS.find((artist) => artist.name === 'Rodrigo');
if (rodrigo) {
  rodrigo.aliases = ['Rodrigo Bueno', 'El Potro Rodrigo', 'Rodrigo Bueno (El Potro)'];
}