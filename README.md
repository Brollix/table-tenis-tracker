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

La idea es dejar de depender de la base de datos local en el teléfono y pasar a un backend con base de datos centralizada, para que cada usuario pueda loguearse y acceder a sus datos desde cualquier dispositivo, y compartir el historial de partidos con el resto del grupo.

Con los partidos centralizados, se habilita sumar un **ranking Elo** entre los jugadores: cada uno arranca con un puntaje base, y después de cada partido el puntaje se actualiza según el resultado y según qué tan favorito era cada jugador (ganarle a alguien mejor rankeado suma más puntos que ganarle a alguien peor rankeado, y perder contra alguien peor rankeado resta más que perder contra alguien mejor). Así, con el tiempo, el ranking refleja mejor el nivel real de cada uno, más allá del simple % de victorias.

Con usuarios registrados, un partido solo se va a poder cargar contra rivales que también estén registrados en la app, y al cargarlo se le manda una notificación al rival para que confirme que el resultado es correcto antes de que impacte en las estadísticas y el Elo de ambos.
