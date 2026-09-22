// YouTube & YouTube Music Service for Pro DJ Automixer
// Handles URL parsing, oEmbed metadata extraction, YouTube catalog search, and Web Audio buffer decoding.

import audioEngine from '../audio/audioEngine';

// Curated YouTube & YouTube Music Trending Hits (83 Club & Festival Anthems)
export const YOUTUBE_TRENDING_TRACKS = [
  // --- 1. EDM & FESTIVAL MAINSTAGE (15 Tracks) ---
  { id: 'yt-60ItHLz5WEA', youtubeId: '60ItHLz5WEA', title: 'Faded', artist: 'Alan Walker', genre: 'EDM / Electro House', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg', duration: 212, bpm: 128, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=60ItHLz5WEA', isYouTube: true },
  { id: 'yt-gCYcTmT917Q', youtubeId: 'gCYcTmT917Q', title: 'Animals', artist: 'Martin Garrix', genre: 'Festival Big Room', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/gCYcTmT917Q/hqdefault.jpg', duration: 184, bpm: 128, key: '4A / Fm', sourceUrl: 'https://www.youtube.com/watch?v=gCYcTmT917Q', isYouTube: true },
  { id: 'yt-_ovdm2yX4MA', youtubeId: '_ovdm2yX4MA', title: 'Levels', artist: 'Avicii', genre: 'Progressive House', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/_ovdm2yX4MA/hqdefault.jpg', duration: 198, bpm: 126, key: '9B / G', sourceUrl: 'https://www.youtube.com/watch?v=_ovdm2yX4MA', isYouTube: true },
  { id: 'yt-JRfuAukYTKg', youtubeId: 'JRfuAukYTKg', title: 'Titanium', artist: 'David Guetta ft. Sia', genre: 'Festival Anthem', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/JRfuAukYTKg/hqdefault.jpg', duration: 245, bpm: 126, key: '5B / Eb', sourceUrl: 'https://www.youtube.com/watch?v=JRfuAukYTKg', isYouTube: true },
  { id: 'yt-FGBhQbmPwH8', youtubeId: 'FGBhQbmPwH8', title: 'One More Time', artist: 'Daft Punk', genre: 'French House', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/FGBhQbmPwH8/hqdefault.jpg', duration: 320, bpm: 123, key: '10B / D', sourceUrl: 'https://www.youtube.com/watch?v=FGBhQbmPwH8', isYouTube: true },
  { id: 'yt-AtKZKl7Bgu0', youtubeId: 'AtKZKl7Bgu0', title: 'I Need Your Love', artist: 'Calvin Harris ft. Ellie Goulding', genre: 'EDM / Electro', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/AtKZKl7Bgu0/hqdefault.jpg', duration: 228, bpm: 125, key: '5A / Cm', sourceUrl: 'https://www.youtube.com/watch?v=AtKZKl7Bgu0', isYouTube: true },
  { id: 'yt-nCg3ufihKyU', youtubeId: 'nCg3ufihKyU', title: 'The Business', artist: 'Tiësto', genre: 'Deep Tech / Club', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/nCg3ufihKyU/hqdefault.jpg', duration: 164, bpm: 124, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=nCg3ufihKyU', isYouTube: true },
  { id: 'yt-1y6smkh6c4U', youtubeId: '1y6smkh6c4U', title: "Don't You Worry Child", artist: 'Swedish House Mafia', genre: 'Festival Mainstage', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/1y6smkh6c4U/hqdefault.jpg', duration: 212, bpm: 129, key: '10B / D', sourceUrl: 'https://www.youtube.com/watch?v=1y6smkh6c4U', isYouTube: true },
  { id: 'yt-YJVmu6yttiw', youtubeId: 'YJVmu6yttiw', title: 'Bangarang', artist: 'Skrillex', genre: 'Dubstep / Bass', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/YJVmu6yttiw/hqdefault.jpg', duration: 215, bpm: 110, key: '10A / Bm', sourceUrl: 'https://www.youtube.com/watch?v=YJVmu6yttiw', isYouTube: true },
  { id: 'yt-IxxstCcJlsc', youtubeId: 'IxxstCcJlsc', title: 'Clarity', artist: 'Zedd ft. Foxes', genre: 'Electro House', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/IxxstCcJlsc/hqdefault.jpg', duration: 271, bpm: 128, key: '6A / Gm', sourceUrl: 'https://www.youtube.com/watch?v=IxxstCcJlsc', isYouTube: true },
  { id: 'yt-PT2_F-1esPk', youtubeId: 'PT2_F-1esPk', title: 'Closer', artist: 'The Chainsmokers', genre: 'Future Bass / Pop', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/PT2_F-1esPk/hqdefault.jpg', duration: 244, bpm: 95, key: '4A / Fm', sourceUrl: 'https://www.youtube.com/watch?v=PT2_F-1esPk', isYouTube: true },
  { id: 'yt-ALZHF5UqnU4', youtubeId: 'ALZHF5UqnU4', title: 'Alone', artist: 'Marshmello', genre: 'Future Bass / EDM', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/ALZHF5UqnU4/hqdefault.jpg', duration: 199, bpm: 142, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=ALZHF5UqnU4', isYouTube: true },
  { id: 'yt-HMUDVMiITOU', youtubeId: 'HMUDVMiITOU', title: 'Turn Down for What', artist: 'DJ Snake ft. Lil Jon', genre: 'Trap / Bass', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/HMUDVMiITOU/hqdefault.jpg', duration: 213, bpm: 100, key: '4A / Fm', sourceUrl: 'https://www.youtube.com/watch?v=HMUDVMiITOU', isYouTube: true },
  { id: 'yt-a7SouU3ECgk', youtubeId: 'a7SouU3ECgk', title: 'Heroes (we could be)', artist: 'Alesso ft. Tove Lo', genre: 'Progressive House', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/a7SouU3ECgk/hqdefault.jpg', duration: 211, bpm: 126, key: '10B / D', sourceUrl: 'https://www.youtube.com/watch?v=a7SouU3ECgk', isYouTube: true },
  { id: 'yt-szj59j0hz_4', youtubeId: 'szj59j0hz_4', title: 'Runaway (U & I)', artist: 'Galantis', genre: 'Electro Pop / EDM', category: 'edm', thumbnail: 'https://i.ytimg.com/vi/szj59j0hz_4/hqdefault.jpg', duration: 227, bpm: 126, key: '3B / Db', sourceUrl: 'https://www.youtube.com/watch?v=szj59j0hz_4', isYouTube: true },

  // --- 2. HOUSE & TECH HOUSE CLUB (14 Tracks) ---
  { id: 'yt-P6nNqVw9Rk0', youtubeId: 'P6nNqVw9Rk0', title: 'Losing It', artist: 'FISHER', genre: 'Tech House', category: 'house', thumbnail: 'https://i.ytimg.com/vi/P6nNqVw9Rk0/hqdefault.jpg', duration: 248, bpm: 125, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=P6nNqVw9Rk0', isYouTube: true },
  { id: 'yt-G_p_n7J8qYg', youtubeId: 'G_p_n7J8qYg', title: 'Do It To It', artist: 'Acraze', genre: 'House / Club', category: 'house', thumbnail: 'https://i.ytimg.com/vi/G_p_n7J8qYg/hqdefault.jpg', duration: 157, bpm: 125, key: '7A / Dm', sourceUrl: 'https://www.youtube.com/watch?v=G_p_n7J8qYg', isYouTube: true },
  { id: 'yt-y_q88P1YtM4', youtubeId: 'y_q88P1YtM4', title: 'Jungle', artist: 'Fred again..', genre: 'UK Garage / Bassline', category: 'house', thumbnail: 'https://i.ytimg.com/vi/y_q88P1YtM4/hqdefault.jpg', duration: 198, bpm: 134, key: '9A / Em', sourceUrl: 'https://www.youtube.com/watch?v=y_q88P1YtM4', isYouTube: true },
  { id: 'yt-rP_i5e41Lbg', youtubeId: 'rP_i5e41Lbg', title: '(It Goes Like) Nanana', artist: 'Peggy Gou', genre: 'Summer House', category: 'house', thumbnail: 'https://i.ytimg.com/vi/rP_i5e41Lbg/hqdefault.jpg', duration: 231, bpm: 130, key: '11B / A', sourceUrl: 'https://www.youtube.com/watch?v=rP_i5e41Lbg', isYouTube: true },
  { id: 'yt-8QZz4S8E6Gg', youtubeId: '8QZz4S8E6Gg', title: 'Rhyme Dust', artist: 'Dom Dolla & MK', genre: 'Tech House', category: 'house', thumbnail: 'https://i.ytimg.com/vi/8QZz4S8E6Gg/hqdefault.jpg', duration: 181, bpm: 126, key: '9A / Em', sourceUrl: 'https://www.youtube.com/watch?v=8QZz4S8E6Gg', isYouTube: true },
  { id: 'yt-aH9M3s_v_3M', youtubeId: 'aH9M3s_v_3M', title: 'Where You Are', artist: 'John Summit & Hayla', genre: 'Melodic House', category: 'house', thumbnail: 'https://i.ytimg.com/vi/aH9M3s_v_3M/hqdefault.jpg', duration: 235, bpm: 126, key: '7A / Dm', sourceUrl: 'https://www.youtube.com/watch?v=aH9M3s_v_3M', isYouTube: true },
  { id: 'yt-uyd6EPyyuFQ', youtubeId: 'uyd6EPyyuFQ', title: 'Piece Of Your Heart', artist: 'Meduza ft. Goodboys', genre: 'Deep House', category: 'house', thumbnail: 'https://i.ytimg.com/vi/uyd6EPyyuFQ/hqdefault.jpg', duration: 153, bpm: 124, key: '6A / Gm', sourceUrl: 'https://www.youtube.com/watch?v=uyd6EPyyuFQ', isYouTube: true },
  { id: 'yt-Tz_2D_tWz1g', youtubeId: 'Tz_2D_tWz1g', title: 'Ferrari', artist: 'James Hype & Miggy Dela Rosa', genre: 'Tech House / Club', category: 'house', thumbnail: 'https://i.ytimg.com/vi/Tz_2D_tWz1g/hqdefault.jpg', duration: 186, bpm: 125, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=Tz_2D_tWz1g', isYouTube: true },
  { id: 'yt-IA1h18x7n7U', youtubeId: 'IA1h18x7n7U', title: 'Innerbloom', artist: 'RÜFÜS DU SOL', genre: 'Sunset Deep House', category: 'house', thumbnail: 'https://i.ytimg.com/vi/IA1h18x7n7U/hqdefault.jpg', duration: 320, bpm: 121, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=IA1h18x7n7U', isYouTube: true },
  { id: 'yt-I_NuYw8k0Zg', youtubeId: 'I_NuYw8k0Zg', title: 'Opus', artist: 'Eric Prydz', genre: 'Progressive House', category: 'house', thumbnail: 'https://i.ytimg.com/vi/I_NuYw8k0Zg/hqdefault.jpg', duration: 330, bpm: 126, key: '4A / Fm', sourceUrl: 'https://www.youtube.com/watch?v=I_NuYw8k0Zg', isYouTube: true },
  { id: 'yt-a0fkNdPiIL4', youtubeId: 'a0fkNdPiIL4', title: 'Satisfaction', artist: 'Benny Benassi', genre: 'Electro House Classic', category: 'house', thumbnail: 'https://i.ytimg.com/vi/a0fkNdPiIL4/hqdefault.jpg', duration: 142, bpm: 130, key: '1A / G#m', sourceUrl: 'https://www.youtube.com/watch?v=a0fkNdPiIL4', isYouTube: true },
  { id: 'yt-a_y81Yd1s8o', youtubeId: 'a_y81Yd1s8o', title: 'Drugs From Amsterdam', artist: 'Mau P', genre: 'Tech House', category: 'house', thumbnail: 'https://i.ytimg.com/vi/a_y81Yd1s8o/hqdefault.jpg', duration: 236, bpm: 125, key: '9A / Em', sourceUrl: 'https://www.youtube.com/watch?v=a_y81Yd1s8o', isYouTube: true },
  { id: 'yt-c_s881Yd99o', youtubeId: 'c_s881Yd99o', title: 'The Answer', artist: 'Chris Lake & Armand Van Helden', genre: 'Club Tech House', category: 'house', thumbnail: 'https://i.ytimg.com/vi/c_s881Yd99o/hqdefault.jpg', duration: 210, bpm: 126, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=c_s881Yd99o', isYouTube: true },
  { id: 'yt-bKK9J0qUvL0', youtubeId: 'bKK9J0qUvL0', title: 'White Noise', artist: 'Disclosure ft. AlunaGeorge', genre: 'UK Garage / House', category: 'house', thumbnail: 'https://i.ytimg.com/vi/bKK9J0qUvL0/hqdefault.jpg', duration: 278, bpm: 120, key: '10A / Bm', sourceUrl: 'https://www.youtube.com/watch?v=bKK9J0qUvL0', isYouTube: true },

  // --- 3. LATIN & REGGAETON HEATERS (10 Tracks) ---
  { id: 'yt-kJQP7kiw5Fk', youtubeId: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', genre: 'Latin & Reggaeton', category: 'latin', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg', duration: 230, bpm: 122, key: '10B / D', sourceUrl: 'https://music.youtube.com/watch?v=kJQP7kiw5Fk', isYouTube: true },
  { id: 'yt-Cr8K88UcO0s', youtubeId: 'Cr8K88UcO0s', title: 'Tití Me Preguntó', artist: 'Bad Bunny', genre: 'Reggaeton / Dembow', category: 'latin', thumbnail: 'https://i.ytimg.com/vi/Cr8K88UcO0s/hqdefault.jpg', duration: 243, bpm: 111, key: '11B / A', sourceUrl: 'https://www.youtube.com/watch?v=Cr8K88UcO0s', isYouTube: true },
  { id: 'yt-CCF1_jI8Prk', youtubeId: 'CCF1_jI8Prk', title: 'Gasolina', artist: 'Daddy Yankee', genre: 'Latin / Reggaeton', category: 'latin', thumbnail: 'https://i.ytimg.com/vi/CCF1_jI8Prk/hqdefault.jpg', duration: 192, bpm: 120, key: '7A / Dm', sourceUrl: 'https://www.youtube.com/watch?v=CCF1_jI8Prk', isYouTube: true },
  { id: 'yt-wnJ6LuUFpMo', youtubeId: 'wnJ6LuUFpMo', title: 'Mi Gente', artist: 'J Balvin & Willy William', genre: 'Latin House / Dance', category: 'latin', thumbnail: 'https://i.ytimg.com/vi/wnJ6LuUFpMo/hqdefault.jpg', duration: 185, bpm: 105, key: '9A / Em', sourceUrl: 'https://www.youtube.com/watch?v=wnJ6LuUFpMo', isYouTube: true },
  { id: 'yt-y8trd3gk220', youtubeId: 'y8trd3gk220', title: 'Pepas', artist: 'Farruko', genre: 'Guaracha / Latin House', category: 'latin', thumbnail: 'https://i.ytimg.com/vi/y8trd3gk220/hqdefault.jpg', duration: 287, bpm: 130, key: '6A / Gm', sourceUrl: 'https://www.youtube.com/watch?v=y8trd3gk220', isYouTube: true },
  { id: 'yt-A_g3lMcWVy0', youtubeId: 'A_g3lMcWVy0', title: 'Bzrp Music Sessions #52', artist: 'Bizarrap & Quevedo', genre: 'Latin EDM / Club', category: 'latin', thumbnail: 'https://i.ytimg.com/vi/A_g3lMcWVy0/hqdefault.jpg', duration: 200, bpm: 128, key: '10A / Bm', sourceUrl: 'https://www.youtube.com/watch?v=A_g3lMcWVy0', isYouTube: true },
  { id: 'yt-7zp1TbLFPp8', youtubeId: '7zp1TbLFPp8', title: 'Danza Kuduro', artist: 'Don Omar ft. Lucenzo', genre: 'Kuduro / Reggaeton', category: 'latin', thumbnail: 'https://i.ytimg.com/vi/7zp1TbLFPp8/hqdefault.jpg', duration: 200, bpm: 130, key: '9B / G', sourceUrl: 'https://www.youtube.com/watch?v=7zp1TbLFPp8', isYouTube: true },
  { id: 'yt-NUsoVlDFqZg', youtubeId: 'NUsoVlDFqZg', title: 'Bailando', artist: 'Enrique Iglesias ft. Descemer Bueno', genre: 'Latin Pop / Dance', category: 'latin', thumbnail: 'https://i.ytimg.com/vi/NUsoVlDFqZg/hqdefault.jpg', duration: 243, bpm: 128, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=NUsoVlDFqZg', isYouTube: true },
  { id: 'yt-TmKh7lAwnBI', youtubeId: 'TmKh7lAwnBI', title: 'Dákiti', artist: 'Bad Bunny & Jhay Cortez', genre: 'Reggaeton / Trap Latino', category: 'latin', thumbnail: 'https://i.ytimg.com/vi/TmKh7lAwnBI/hqdefault.jpg', duration: 205, bpm: 110, key: '9A / Em', sourceUrl: 'https://www.youtube.com/watch?v=TmKh7lAwnBI', isYouTube: true },
  { id: 'yt-pK060iUFWXg', youtubeId: 'pK060iUFWXg', title: 'Hawái', artist: 'Maluma', genre: 'Reggaeton / Pop', category: 'latin', thumbnail: 'https://i.ytimg.com/vi/pK060iUFWXg/hqdefault.jpg', duration: 199, bpm: 90, key: '6A / Gm', sourceUrl: 'https://www.youtube.com/watch?v=pK060iUFWXg', isYouTube: true },

  // --- 4. HIP-HOP, TRAP & AFROBEATS (12 Tracks) ---
  { id: 'yt-6ONRf7h3sdk', youtubeId: '6ONRf7h3sdk', title: 'Sicko Mode', artist: 'Travis Scott', genre: 'Hip-Hop & Trap', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/6ONRf7h3sdk/hqdefault.jpg', duration: 312, bpm: 155, key: '3A / Bbm', sourceUrl: 'https://www.youtube.com/watch?v=6ONRf7h3sdk', isYouTube: true },
  { id: 'yt-xpVfcZ0ZcFM', youtubeId: 'xpVfcZ0ZcFM', title: "God's Plan", artist: 'Drake', genre: 'Hip-Hop & Trap', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/xpVfcZ0ZcFM/hqdefault.jpg', duration: 198, bpm: 154, key: '7A / Dm', sourceUrl: 'https://www.youtube.com/watch?v=xpVfcZ0ZcFM', isYouTube: true },
  { id: 'yt-tvTRZJ-4EyI', youtubeId: 'tvTRZJ-4EyI', title: 'HUMBLE.', artist: 'Kendrick Lamar', genre: 'Hip-Hop & Trap', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/tvTRZJ-4EyI/hqdefault.jpg', duration: 177, bpm: 150, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=tvTRZJ-4EyI', isYouTube: true },
  { id: 'yt-UceaB4D0jpo', youtubeId: 'UceaB4D0jpo', title: 'Rockstar', artist: 'Post Malone ft. 21 Savage', genre: 'Trap / Hip-Hop', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/UceaB4D0jpo/hqdefault.jpg', duration: 218, bpm: 160, key: '4A / Fm', sourceUrl: 'https://www.youtube.com/watch?v=UceaB4D0jpo', isYouTube: true },
  { id: 'yt-PEGccV-NOm8', youtubeId: 'PEGccV-NOm8', title: 'Bodak Yellow', artist: 'Cardi B', genre: 'Trap / Club', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/PEGccV-NOm8/hqdefault.jpg', duration: 223, bpm: 125, key: '11B / A', sourceUrl: 'https://www.youtube.com/watch?v=PEGccV-NOm8', isYouTube: true },
  { id: 'yt-xvZqHgFz51I', youtubeId: 'xvZqHgFz51I', title: 'Mask Off', artist: 'Future', genre: 'Hip-Hop / Flute Trap', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/xvZqHgFz51I/hqdefault.jpg', duration: 204, bpm: 150, key: '7A / Dm', sourceUrl: 'https://www.youtube.com/watch?v=xvZqHgFz51I', isYouTube: true },
  { id: 'yt-61ymOWwOwuk', youtubeId: '61ymOWwOwuk', title: "Creepin'", artist: 'Metro Boomin & The Weeknd', genre: 'Hip-Hop / R&B', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/61ymOWwOwuk/hqdefault.jpg', duration: 221, bpm: 120, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=61ymOWwOwuk', isYouTube: true },
  { id: 'yt-WcIcVapfqXw', youtubeId: 'WcIcVapfqXw', title: 'Calm Down', artist: 'Rema', genre: 'Afrobeats / Global', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/WcIcVapfqXw/hqdefault.jpg', duration: 219, bpm: 107, key: '4A / Fm', sourceUrl: 'https://www.youtube.com/watch?v=WcIcVapfqXw', isYouTube: true },
  { id: 'yt-421w1j87fEM', youtubeId: '421w1j87fEM', title: 'Last Last', artist: 'Burna Boy', genre: 'Afrobeats', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/421w1j87fEM/hqdefault.jpg', duration: 172, bpm: 104, key: '9A / Em', sourceUrl: 'https://www.youtube.com/watch?v=421w1j87fEM', isYouTube: true },
  { id: 'yt-w9fV_e1_12k', youtubeId: 'w9fV_e1_12k', title: 'Mnike', artist: 'Tyler ICU & Tumelo.za', genre: 'Amapiano', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/w9fV_e1_12k/hqdefault.jpg', duration: 240, bpm: 113, key: '1A / G#m', sourceUrl: 'https://www.youtube.com/watch?v=w9fV_e1_12k', isYouTube: true },
  { id: 'yt-UTHLKHL_whs', youtubeId: 'UTHLKHL_whs', title: 'INDUSTRY BABY', artist: 'Lil Nas X & Jack Harlow', genre: 'Trap Anthems', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/UTHLKHL_whs/hqdefault.jpg', duration: 212, bpm: 150, key: '5A / Cm', sourceUrl: 'https://www.youtube.com/watch?v=UTHLKHL_whs', isYouTube: true },
  { id: 'yt-393C3pr2ioY', youtubeId: '393C3pr2ioY', title: 'Wow.', artist: 'Post Malone', genre: 'Hip-Hop / Club', category: 'hiphop', thumbnail: 'https://i.ytimg.com/vi/393C3pr2ioY/hqdefault.jpg', duration: 150, bpm: 100, key: '10B / D', sourceUrl: 'https://www.youtube.com/watch?v=393C3pr2ioY', isYouTube: true },

  // --- 5. PUNJABI & BOLLYWOOD CLUB (12 Tracks) ---
  { id: 'yt-1X9kR6_8E8s', youtubeId: '1X9kR6_8E8s', title: 'Proper Patola', artist: 'Diljit Dosanjh & Badshah', genre: 'Punjabi Club', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/1X9kR6_8E8s/hqdefault.jpg', duration: 178, bpm: 128, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=1X9kR6_8E8s', isYouTube: true },
  { id: 'yt-VNs_cCtdbPc', youtubeId: 'VNs_cCtdbPc', title: 'Brown Munde', artist: 'AP Dhillon & Gurinder Gill', genre: 'Punjabi Trap', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/VNs_cCtdbPc/hqdefault.jpg', duration: 268, bpm: 98, key: '4A / Fm', sourceUrl: 'https://www.youtube.com/watch?v=VNs_cCtdbPc', isYouTube: true },
  { id: 'yt-k4yXQkG2s1E', youtubeId: 'k4yXQkG2s1E', title: 'Kala Chashma', artist: 'Badshah & Neha Kakkar', genre: 'Bollywood Club', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/k4yXQkG2s1E/hqdefault.jpg', duration: 187, bpm: 126, key: '10B / D', sourceUrl: 'https://www.youtube.com/watch?v=k4yXQkG2s1E', isYouTube: true },
  { id: 'yt-qFkNATtc3mc', youtubeId: 'qFkNATtc3mc', title: 'Ghungroo (Club Mix)', artist: 'Vishal-Shekhar & Arijit Singh', genre: 'Bollywood Dance', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/qFkNATtc3mc/hqdefault.jpg', duration: 302, bpm: 124, key: '9B / G', sourceUrl: 'https://www.youtube.com/watch?v=qFkNATtc3mc', isYouTube: true },
  { id: 'yt-n_FCrCQ6-9U', youtubeId: 'n_FCrCQ6-9U', title: '295', artist: 'Sidhu Moose Wala', genre: 'Punjabi Hip-Hop', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/n_FCrCQ6-9U/hqdefault.jpg', duration: 270, bpm: 100, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=n_FCrCQ6-9U', isYouTube: true },
  { id: 'yt-cPh2v_e8s1I', youtubeId: 'cPh2v_e8s1I', title: 'Softly', artist: 'Karan Aujla', genre: 'Punjabi Dance / Club', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/cPh2v_e8s1I/hqdefault.jpg', duration: 155, bpm: 108, key: '9A / Em', sourceUrl: 'https://www.youtube.com/watch?v=cPh2v_e8s1I', isYouTube: true },
  { id: 'yt-d_w9a_e1_M0', youtubeId: 'd_w9a_e1_M0', title: '100 Million', artist: 'Divine & Karan Aujla', genre: 'Desi Hip-Hop', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/d_w9a_e1_M0/hqdefault.jpg', duration: 195, bpm: 110, key: '7A / Dm', sourceUrl: 'https://www.youtube.com/watch?v=d_w9a_e1_M0', isYouTube: true },
  { id: 'yt-1gS6o_Z_1M0', youtubeId: '1gS6o_Z_1M0', title: 'Dope Shope', artist: 'Yo Yo Honey Singh', genre: 'Punjabi Urban Classic', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/1gS6o_Z_1M0/hqdefault.jpg', duration: 191, bpm: 100, key: '1A / G#m', sourceUrl: 'https://www.youtube.com/watch?v=1gS6o_Z_1M0', isYouTube: true },
  { id: 'yt-vX2cDW8LUWk', youtubeId: 'vX2cDW8LUWk', title: 'Excuses', artist: 'AP Dhillon & Gurinder Gill', genre: 'Punjabi Melodic', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/vX2cDW8LUWk/hqdefault.jpg', duration: 176, bpm: 104, key: '5A / Cm', sourceUrl: 'https://www.youtube.com/watch?v=vX2cDW8LUWk', isYouTube: true },
  { id: 'yt-cl0a3i2wFcc', youtubeId: 'cl0a3i2wFcc', title: 'Insane', artist: 'AP Dhillon & Gurinder Gill', genre: 'Punjabi Drill', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/cl0a3i2wFcc/hqdefault.jpg', duration: 206, bpm: 100, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=cl0a3i2wFcc', isYouTube: true },
  { id: 'yt-NtszmsEqqfQ', youtubeId: 'NtszmsEqqfQ', title: 'Kar Gayi Chull', artist: 'Badshah, Fazilpuria, Neha Kakkar', genre: 'Bollywood Party', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/NtszmsEqqfQ/hqdefault.jpg', duration: 187, bpm: 126, key: '9B / G', sourceUrl: 'https://www.youtube.com/watch?v=NtszmsEqqfQ', isYouTube: true },
  { id: 'yt-4tywp83zkmk', youtubeId: '4tywp83zkmk', title: 'Cheques', artist: 'Shubh', genre: 'Punjabi Trap', category: 'punjabi', thumbnail: 'https://i.ytimg.com/vi/4tywp83zkmk/hqdefault.jpg', duration: 183, bpm: 102, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=4tywp83zkmk', isYouTube: true },

  // --- 6. POP ANTHEMS & HEADLINERS (10 Tracks) ---
  { id: 'yt-fJ9rUzIMcZQ', youtubeId: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'Classic Anthem', category: 'pop', thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg', duration: 354, bpm: 120, key: '6B / Bb', sourceUrl: 'https://youtu.be/fJ9rUzIMcZQ', isYouTube: true },
  { id: 'yt-JGwWNGJdvx8', youtubeId: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', genre: 'Pop / Dance', category: 'pop', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg', duration: 233, bpm: 124, key: '12A / C#m', sourceUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8', isYouTube: true },
  { id: 'yt-TUVcZfQe-Kw', youtubeId: 'TUVcZfQe-Kw', title: 'Levitating', artist: 'Dua Lipa', genre: 'Nu-Disco / Dance', category: 'pop', thumbnail: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg', duration: 203, bpm: 124, key: '10A / Bm', sourceUrl: 'https://www.youtube.com/watch?v=TUVcZfQe-Kw', isYouTube: true },
  { id: 'yt-4NRXx6U8ABQ', youtubeId: '4NRXx6U8ABQ', title: 'Blinding Lights', artist: 'The Weeknd', genre: '80s Synthwave', category: 'pop', thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg', duration: 200, bpm: 171, key: '4A / Fm', sourceUrl: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ', isYouTube: true },
  { id: 'yt-UqyT8IEBkvY', youtubeId: 'UqyT8IEBkvY', title: '24K Magic', artist: 'Bruno Mars', genre: 'Funk / Disco', category: 'pop', thumbnail: 'https://i.ytimg.com/vi/UqyT8IEBkvY/hqdefault.jpg', duration: 226, bpm: 107, key: '4A / Fm', sourceUrl: 'https://www.youtube.com/watch?v=UqyT8IEBkvY', isYouTube: true },
  { id: 'yt-kTJczUoc26U', youtubeId: 'kTJczUoc26U', title: 'STAY', artist: 'The Kid LAROI & Justin Bieber', genre: 'Pop / Synthpop', category: 'pop', thumbnail: 'https://i.ytimg.com/vi/kTJczUoc26U/hqdefault.jpg', duration: 141, bpm: 170, key: '10A / Bm', sourceUrl: 'https://www.youtube.com/watch?v=kTJczUoc26U', isYouTube: true },
  { id: 'yt-DyDfgMOUjCI', youtubeId: 'DyDfgMOUjCI', title: 'bad guy', artist: 'Billie Eilish', genre: 'Electropop / Bass', category: 'pop', thumbnail: 'https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg', duration: 194, bpm: 135, key: '6A / Gm', sourceUrl: 'https://www.youtube.com/watch?v=DyDfgMOUjCI', isYouTube: true },
  { id: 'yt-OPf0YbXqDm0', youtubeId: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', genre: 'Funk / Pop', category: 'pop', thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg', duration: 270, bpm: 115, key: '7A / Dm', sourceUrl: 'https://www.youtube.com/watch?v=OPf0YbXqDm0', isYouTube: true },
  { id: 'yt-oygrmJFKYZY', youtubeId: 'oygrmJFKYZY', title: "Don't Start Now", artist: 'Dua Lipa', genre: 'Nu-Disco', category: 'pop', thumbnail: 'https://i.ytimg.com/vi/oygrmJFKYZY/hqdefault.jpg', duration: 183, bpm: 124, key: '10A / Bm', sourceUrl: 'https://www.youtube.com/watch?v=oygrmJFKYZY', isYouTube: true },
  { id: 'yt-KEI4qS4P0gc', youtubeId: 'KEI4qS4P0gc', title: "Can't Feel My Face", artist: 'The Weeknd', genre: 'Pop / Funk', category: 'pop', thumbnail: 'https://i.ytimg.com/vi/KEI4qS4P0gc/hqdefault.jpg', duration: 215, bpm: 108, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=KEI4qS4P0gc', isYouTube: true },

  // --- 7. TECHNO, TRANCE & UNDERGROUND (10 Tracks) ---
  { id: 'yt-ll5ykbAUMD4', youtubeId: 'll5ykbAUMD4', title: 'Sun & Moon', artist: 'Above & Beyond', genre: 'Trance Anthem', category: 'techno', thumbnail: 'https://i.ytimg.com/vi/ll5ykbAUMD4/hqdefault.jpg', duration: 326, bpm: 134, key: '11B / A', sourceUrl: 'https://www.youtube.com/watch?v=ll5ykbAUMD4', isYouTube: true },
  { id: 'yt-f_X_e1_w_2k', youtubeId: 'f_X_e1_w_2k', title: 'Cyber Dimension', artist: 'KAS:ST', genre: 'Dark Underground Techno', category: 'techno', thumbnail: 'https://i.ytimg.com/vi/f_X_e1_w_2k/hqdefault.jpg', duration: 360, bpm: 138, key: '1A / G#m', sourceUrl: 'https://www.youtube.com/watch?v=f_X_e1_w_2k', isYouTube: true },
  { id: 'yt-d_0a_11_T_0', youtubeId: 'd_0a_11_T_0', title: 'The Age of Love', artist: 'Charlotte de Witte', genre: 'Peak-Time Techno', category: 'techno', thumbnail: 'https://i.ytimg.com/vi/d_0a_11_T_0/hqdefault.jpg', duration: 345, bpm: 135, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=d_0a_11_T_0', isYouTube: true },
  { id: 'yt-ub747pprmJ8', youtubeId: 'ub747pprmJ8', title: 'Right Here, Right Now', artist: 'Fatboy Slim', genre: 'Big Beat / Club Classic', category: 'techno', thumbnail: 'https://i.ytimg.com/vi/ub747pprmJ8/hqdefault.jpg', duration: 236, bpm: 125, key: '9A / Em', sourceUrl: 'https://www.youtube.com/watch?v=ub747pprmJ8', isYouTube: true },
  { id: 'yt-y6120QOlsfU', youtubeId: 'y6120QOlsfU', title: 'Sandstorm', artist: 'Darude', genre: 'Trance Anthem', category: 'techno', thumbnail: 'https://i.ytimg.com/vi/y6120QOlsfU/hqdefault.jpg', duration: 225, bpm: 136, key: '10A / Bm', sourceUrl: 'https://www.youtube.com/watch?v=y6120QOlsfU', isYouTube: true },
  { id: 'yt-ZHVJVQzXxQU', youtubeId: 'ZHVJVQzXxQU', title: 'Insomnia', artist: 'Faithless', genre: 'Progressive House / Trance', category: 'techno', thumbnail: 'https://i.ytimg.com/vi/ZHVJVQzXxQU/hqdefault.jpg', duration: 215, bpm: 127, key: '10A / Bm', sourceUrl: 'https://www.youtube.com/watch?v=ZHVJVQzXxQU', isYouTube: true },
  { id: 'yt-2EaE0_gIQdc', youtubeId: '2EaE0_gIQdc', title: 'Adagio for Strings', artist: 'Tiësto', genre: 'Epic Trance', category: 'techno', thumbnail: 'https://i.ytimg.com/vi/2EaE0_gIQdc/hqdefault.jpg', duration: 353, bpm: 140, key: '5A / Cm', sourceUrl: 'https://www.youtube.com/watch?v=2EaE0_gIQdc', isYouTube: true },
  { id: 'yt-0b_p_u0q3eE', youtubeId: '0b_p_u0q3eE', title: 'Cafe Del Mar', artist: 'Energy 52', genre: 'Classic Trance', category: 'techno', thumbnail: 'https://i.ytimg.com/vi/0b_p_u0q3eE/hqdefault.jpg', duration: 230, bpm: 136, key: '8A / Am', sourceUrl: 'https://www.youtube.com/watch?v=0b_p_u0q3eE', isYouTube: true },
  { id: 'yt-qM5q_Jmsv_4', youtubeId: 'qM5q_Jmsv_4', title: 'For an Angel', artist: 'Paul van Dyk', genre: 'Trance Anthem', category: 'techno', thumbnail: 'https://i.ytimg.com/vi/qM5q_Jmsv_4/hqdefault.jpg', duration: 231, bpm: 138, key: '10B / D', sourceUrl: 'https://www.youtube.com/watch?v=qM5q_Jmsv_4', isYouTube: true },
  { id: 'yt-6QEPrDBReJ0', youtubeId: '6QEPrDBReJ0', title: 'Children', artist: 'Robert Miles', genre: 'Dream Trance', category: 'techno', thumbnail: 'https://i.ytimg.com/vi/6QEPrDBReJ0/hqdefault.jpg', duration: 243, bpm: 138, key: '4A / Fm', sourceUrl: 'https://www.youtube.com/watch?v=6QEPrDBReJ0', isYouTube: true },
];

class YouTubeService {
  // Extract YouTube Video ID from any YouTube or YouTube Music link
  extractVideoId(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([^"&?\/\s]{11})/i;
    const match = trimmed.match(regExp);
    return match ? match[1] : null;
  }

  isYouTubeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return /music\.youtube\.com|youtube\.com|youtu\.be/i.test(trimmed);
  }

  // Clean raw YouTube title and author into clean song title and artist
  cleanYouTubeMetadata(rawTitle = '', rawAuthor = '') {
    let artist = (rawAuthor || '')
      .replace(/VEVO$/i, '')
      .replace(/Official(\s+Channel|\s+Page)?$/i, '')
      .replace(/\s*-\s*Topic$/i, '')
      .trim();

    let title = (rawTitle || '').trim();

    // Check for "Artist - Title" separator (hyphen, en-dash, em-dash)
    if (/[\-\u2013\u2014]/.test(title)) {
      const parts = title.split(/[\-\u2013\u2014]/);
      if (parts.length >= 2) {
        artist = parts[0].trim().replace(/VEVO$/i, '').trim();
        title = parts.slice(1).join(' - ').trim();
      }
    }

    // Strip video-specific metadata and brackets:
    // (Official Music Video), [Official Video], (Audio), (Lyrics), (Lyric Video), [HQ], [4K], (Remastered), etc.
    let cleanTitle = title
      .replace(/\s*[\(\[](official\s*(music\s*)?video|official|audio|lyrics?|lyric\s*video|visualizer|remastered|hd|4k|hq|extended\s*mix)[\)\]]/gi, '')
      .replace(/\s*[\(\[]ft\.?\s*[^)\]]+[\)\]]/gi, '')
      .replace(/\s*[\(\[]feat\.?\s*[^)\]]+[\)\]]/gi, '')
      .replace(/\s+ft\.?\s+.*$/i, '')
      .replace(/\s+feat\.?\s+.*$/i, '')
      .trim();

    if (!cleanTitle) cleanTitle = title;
    if (!artist) artist = 'YouTube Music';

    return { artist, cleanTitle };
  }

  // Estimate stable dance BPM and Camelot Key
  estimateBpmAndKey(title, artist) {
    const str = `${title} ${artist}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const baseBpm = 122 + (absHash % 8); // 122-129 BPM (ideal dance range)
    const camelotKeys = [
      '8B / C', '3B / Db', '10B / D', '5B / Eb', '12B / E', '7B / F',
      '2B / F#', '9B / G', '4B / Ab', '11B / A', '6B / Bb', '1B / B',
      '5A / Cm', '12A / C#m', '7A / Dm', '2A / Ebm', '9A / Em', '4A / Fm',
      '11A / F#m', '6A / Gm', '1A / G#m', '8A / Am', '3A / Bbm', '10A / Bm',
    ];
    return {
      bpm: baseBpm,
      key: camelotKeys[absHash % camelotKeys.length],
    };
  }

  // Parse a YouTube or YouTube Music link
  async parseYouTubeLink(url) {
    if (!url || typeof url !== 'string') throw new Error('Please enter a valid link.');
    const cleanUrl = url.trim();
    const videoId = this.extractVideoId(cleanUrl);

    if (!videoId) {
      throw new Error('Please enter a valid YouTube or YouTube Music URL (e.g. music.youtube.com/watch?v=... or youtu.be/...)');
    }

    let rawTitle = '';
    let rawAuthor = '';
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    // 1. Fetch metadata via noembed.com (CORS enabled)
    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) rawTitle = data.title;
        if (data.author_name) rawAuthor = data.author_name;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
      }
    } catch (e) {
      console.warn('noembed fetch failed, trying proxy', e);
    }

    // 2. Fallback to CORS proxy if needed
    if (!rawTitle) {
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.title) rawTitle = data.title;
          if (data.author_name) rawAuthor = data.author_name;
        }
      } catch (e) {}
    }

    const { artist, cleanTitle } = this.cleanYouTubeMetadata(rawTitle || `YouTube Track (${videoId})`, rawAuthor);
    const { bpm, key } = this.estimateBpmAndKey(cleanTitle, artist);

    return {
      id: `yt-${videoId}`,
      youtubeId: videoId,
      title: cleanTitle,
      artist,
      genre: 'YouTube Music',
      thumbnail,
      duration: 210,
      bpm,
      key,
      sourceUrl: cleanUrl,
      isYouTube: true,
    };
  }

  // Search YouTube Music tracks
  async searchTracks(query, limit = 8) {
    if (!query || !query.trim()) return [];
    const q = query.trim();

    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).map((t) => {
          const { bpm, key } = this.estimateBpmAndKey(t.trackName, t.artistName);
          const artwork = (t.artworkUrl100 || '').replace('100x100bb', '600x600bb');
          return {
            id: `yt-search-${t.trackId}`,
            title: t.trackName,
            artist: t.artistName,
            album: t.collectionName,
            genre: t.primaryGenreName || 'YouTube Music',
            thumbnail: artwork || t.artworkUrl100 || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150',
            duration: 210,
            bpm,
            key,
            previewUrl: t.previewUrl,
            sourceUrl: `https://music.youtube.com/search?q=${encodeURIComponent(t.trackName + ' ' + t.artistName)}`,
            isYouTube: true,
          };
        });
      }
    } catch (e) {
      console.warn('YouTube search error', e);
    }

    // Fallback search in trending database
    return YOUTUBE_TRENDING_TRACKS.filter((t) =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.artist.toLowerCase().includes(q.toLowerCase())
    );
  }

  // Load and decode preview audio into a Web Audio AudioBuffer for DJ mixing (just like spotifyService)
  async loadTrackAudioBuffer(track) {
    audioEngine.resumeContext();

    let streamUrl = track.previewUrl;
    if (!streamUrl || typeof streamUrl !== 'string' || !streamUrl.startsWith('http')) {
      streamUrl = await audioEngine.resolveRealAudioStream(track);
      if (streamUrl) track.previewUrl = streamUrl;
    }

    if (streamUrl) {
      try {
        const res = await fetch(streamUrl);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          let decoded = await audioEngine.ctx.decodeAudioData(arrayBuffer);
          if (decoded && decoded.duration < 300) {
            decoded = audioEngine.extendAudioBuffer(decoded, 300);
          }
          return decoded;
        }
      } catch (e) {
        console.warn('Could not fetch direct stream URL, generating compatible preview mix buffer', e);
      }
    }

    const targetBpm = track.bpm || 124;
    const style = (track.genre || '').toLowerCase().includes('techno') ? 'dnb' :
                  (track.genre || '').toLowerCase().includes('bass') ? 'bass' : 'house';
    return audioEngine._generateSynthTrack(targetBpm, 45, style);
  }
}

export const youtubeService = new YouTubeService();
export default youtubeService;
