export const DARES = [
  { emoji: '🦖', text: 'Make your scariest dinosaur face!',        sub: 'Hold it for 3 seconds…'      },
  { emoji: '👻', text: 'Pretend you just saw a ghost!',            sub: 'Extra spooky points!'         },
  { emoji: '🚀', text: "You're a rocket launching to space!",       sub: '3… 2… 1… lift off!'          },
  { emoji: '🦁', text: 'Roar like a lion!',                        sub: 'The louder the better!'      },
  { emoji: '🤖', text: "You're a robot. Act like it!",             sub: 'Beep boop.'                  },
  { emoji: '🌊', text: 'Ride an invisible surfboard!',             sub: 'Hang ten, dude!'             },
  { emoji: '🧙', text: 'Cast a magical spell!',                    sub: 'Abracadabra!'                },
  { emoji: '🐸', text: 'Hop like a frog!',                         sub: 'Ribbit!'                     },
  { emoji: '🎸', text: 'Shred the invisible guitar!',              sub: 'Feel the music!'             },
  { emoji: '🦸', text: "Strike your best superhero pose!",         sub: 'The world needs you!'        },
  { emoji: '🍕', text: 'Show us your pizza face!',                 sub: 'Extra cheese please!'        },
  { emoji: '🌈', text: 'Make a rainbow with your arms!',           sub: 'Over the top!'              },
  { emoji: '🐧', text: 'Waddle like a penguin!',                   sub: 'Tuxedo required!'            },
  { emoji: '🎩', text: 'Take an invisible bow on stage!',          sub: 'The crowd goes wild!'        },
  { emoji: '🦋', text: 'Spread your wings and flutter!',           sub: 'Beautiful!'                 },
]

export function getRandomDare() {
  return DARES[Math.floor(Math.random() * DARES.length)]
}

export function shuffleDare(current) {
  const others = DARES.filter(d => d.text !== current.text)
  return others[Math.floor(Math.random() * others.length)]
}
