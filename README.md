# 🏓 Tracker TDM

App para llevar el registro de partidos de tenis de mesa entre amigos: quién jugó, quién ganó, set por set, y las estadísticas de cada jugador a lo largo del tiempo. Pensada para anotar el resultado ahí mismo, apenas termina el partido, sin vueltas.

Por ahora todo se guarda en el celular, sin necesidad de internet.

## Qué tiene

- Historial de partidos jugados
- Carga de partidos nuevos (individuales o dobles), set por set
- Gestión de jugadores
- Estadísticas por jugador (ganados, perdidos, % de victorias)
- Backup/restauración de los datos

Hecha con Expo / React Native, para Android e iOS.

## A futuro

**Backend centralizado**
- Dejar de depender de la base de datos local en el teléfono
- Login por usuario, con acceso a los datos desde cualquier dispositivo
- Historial de partidos compartido entre todo el grupo

**Ranking Elo**
- Cada jugador arranca con un puntaje base
- Después de cada partido, el puntaje se actualiza según el resultado y qué tan favorito era cada uno
  - Ganarle a alguien mejor rankeado suma más puntos que ganarle a alguien peor rankeado
  - Perder contra alguien peor rankeado resta más que perder contra alguien mejor
- El ranking termina reflejando el nivel real de cada uno, más allá del simple % de victorias

**Confirmación de partidos**
- Un partido solo se va a poder cargar contra rivales registrados en la app
- Al cargarlo, se le manda una notificación al rival para que confirme el resultado
- Recién ahí impacta en las estadísticas y el Elo de ambos
