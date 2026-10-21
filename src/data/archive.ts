// Early work, 2017–2021, carried over from the previous portfolio (content/projects, timeline,
// image-alt.json). Photos live in public/archive, resized with metadata stripped.

export interface ArchivePhoto {
  file: string;
  alt: string;
  caption: string;
}

export interface ArchiveEntry {
  year: string;
  title: string;
  role: string;
  summary: string;
  photos: ArchivePhoto[];
}

export const archive: ArchiveEntry[] = [
  {
    "year": "2017",
    "title": "MagLev Train & RFID Ticketing",
    "role": "Team Leader · West Yangon Technological University",
    "summary": "A magnetic-levitation train model with an RFID ticketing system. First prize at the WYTU Science Fair, covered in national newspapers.",
    "photos": [
      {
        "file": "01-1st-prize-group-project-in-wytu-science-fair-2017.jpg",
        "alt": "Four students in white shirts and checked longyis stand under a teal canopy, one holding a framed certificate printed in Burmese, another a small gold trophy.",
        "caption": "1st Prize Group Project in WYTU Science Fair 2017"
      },
      {
        "file": "16-doing-our-project.jpg",
        "alt": "Two people work at floor level on a surface covered in white foam boards, one bent over a magnifier lamp amid loose wires, coils and a microcontroller board.",
        "caption": "Doing our project"
      },
      {
        "file": "17-outcome-of-it.jpg",
        "alt": "A tabletop city model with lit tower blocks, a station building and a small blue and white train on a track, shown to a row of officials while press cameras record.",
        "caption": "Outcome of it !"
      },
      {
        "file": "02-our-project-appearances-in-local-newspapers.jpg",
        "alt": "A printed newspaper page showing a photograph of officials and students in white shirts crowded around a tabletop model with miniature trees and green landscaping.",
        "caption": "Our project appearances in local newspapers"
      }
    ]
  },
  {
    "year": "2018",
    "title": "Clash of Robots, Phase I",
    "role": "Founder & organiser · Yangon",
    "summary": "Organised the first robot tournament ever held in Myanmar, to connect hobbyists and students in a field that barely existed in the country. It has run yearly since.",
    "photos": [
      {
        "file": "03-clash-of-robots-phase-i.jpg",
        "alt": "About twenty people pose in three rows on a stage in front of a bright pink screen carrying a cartoon robot logo, with a wall clock and wooden lectern nearby.",
        "caption": "Clash of Robots Phase I"
      },
      {
        "file": "04-the-very-first-local-robotics-competition-held-in-2018.jpg",
        "alt": "A dense crowd presses around a blue mat arena ringed with red tape while two small wheeled robots meet inside a black circle at its centre.",
        "caption": "The very first local robotics competition held in 2018"
      }
    ]
  },
  {
    "year": "2019",
    "title": "Campus Meter, First Prize at Makekathon",
    "role": "Creator · ESP32 IoT",
    "summary": "Detects unhealthy smoke and air quality on campus and reports through a Messenger chatbot.",
    "photos": [
      {
        "file": "05-golden-makers-at-makekathon-2019.jpg",
        "alt": "Four people in red and blue K.LAB t-shirts pose on a metal bench before a red sponsor banner reading MAKERS GONNA MAKE, two holding a wooden award plaque.",
        "caption": "Golden Makers at MAKEKATHON 2019"
      },
      {
        "file": "18-the-blue-plastic-bottle-is-the-project-we-also-used-recycle-.jpg",
        "alt": "A wooden plaque engraved MAKE-A-THON 1st GOLDEN MAKER lies on a table while a hand holds up a silver-painted plastic bottle used as a vase for dried flowers.",
        "caption": "The blue plastic bottle is the project! We also used recycle techniques xD"
      }
    ]
  },
  {
    "year": "2019",
    "title": "Clash of Robots, Phase II",
    "role": "Organiser · Mandalay",
    "summary": "Second edition, themed on PID robot control, taking the competition beyond Yangon.",
    "photos": [
      {
        "file": "06-clash-of-robots-phase-ii-in-mandalay.jpg",
        "alt": "Nine people in white t-shirts sprawl across a blue stage in playful crossed-arm and hand-sign poses, in front of a banner for a Mandalay agriculture show.",
        "caption": "Clash of Robots Phase II in Mandalay"
      }
    ]
  },
  {
    "year": "2019",
    "title": "Rugby Robots, World Robot Games Thailand",
    "role": "Team Lead",
    "summary": "Three competition robots designed in SolidWorks and laser-cut, on Pololu motors. Took a Performance Award.",
    "photos": [
      {
        "file": "19-rugby-robot.jpg",
        "alt": "A small four-wheeled robot with angular bare aluminium bodywork and chunky off-road tyres on blue rims, sitting on a green steel workbench marked with pencil sketches.",
        "caption": "Rugby Robot"
      },
      {
        "file": "07-wrg-thailand-2019-rubgy-robot.jpg",
        "alt": "Four people in bright green team shirts stand in a line holding radio controllers, with four small wheeled robots lined up on the polished floor at their feet.",
        "caption": "WRG Thailand 2019 Rubgy Robot"
      },
      {
        "file": "20-our-team-awards.jpg",
        "alt": "Four bronze medals on red ribbons rest on a black case, each stamped Performance Award, Thailand, World Robot Games 2019 around a gear emblem.",
        "caption": "Our Team awards !"
      },
      {
        "file": "08-performance-award.jpg",
        "alt": "Five people stand on a blue stage before a large World Robot Games Thailand backdrop, four of them wearing medals, with national flags on stands to either side.",
        "caption": "Performance Award"
      }
    ]
  },
  {
    "year": "2019",
    "title": "Smart Green House",
    "role": "Creator · WYTU",
    "summary": "A sensor-instrumented greenhouse prototype with automated environmental control.",
    "photos": [
      {
        "file": "22-smart-green-house.jpg",
        "alt": "A small clear-walled greenhouse model filled with soil and three leafy seedlings, with a sensor on a bracket, wiring and an LCD module along the left edge.",
        "caption": "Smart Green House project"
      }
    ]
  },
  {
    "year": "2020",
    "title": "World Robot Games Myanmar",
    "role": "Organiser · Yangon",
    "summary": "Created and ran the national games: line-tracing, on-water and rugby robots, plus STEM camps and robot tours across Yangon.",
    "photos": [
      {
        "file": "10-world-robot-games-myanmar-2020.jpg",
        "alt": "Roughly sixty people sit and stand in rows across a stage beneath a screen showing three cartoon robot icons labelled Line Tracing, Robot Rugby and On Water.",
        "caption": "World Robot Games Myanmar 2020"
      },
      {
        "file": "09-robot-tours.jpg",
        "alt": "A packed crowd of students in white shirts and green longyis crouches and cheers around a tiled floor marked out with tape lanes for small robots.",
        "caption": "Robot Tours"
      }
    ]
  },
  {
    "year": "2020",
    "title": "COVID-19 Disinfection Chamber",
    "role": "Co-inventor",
    "summary": "Designed and donated disinfection chambers to hospitals and public areas during Myanmar's first COVID-19 wave.",
    "photos": [
      {
        "file": "11-building-disinfection-chamber.jpg",
        "alt": "Three people work at night on a tall boxy aluminium frame, one reaching up to a small blue spray nozzle while another steadies a vertical post.",
        "caption": "Building Disinfection Chamber"
      },
      {
        "file": "12-disinfection-chamber.jpg",
        "alt": "A freestanding booth roughly the height of a doorway, clad in translucent corrugated polycarbonate on an aluminium frame, parked in a workshop under a metal roof.",
        "caption": "Disinfection Chamber"
      },
      {
        "file": "23-our-team.jpg",
        "alt": "About ten people line a bright corridor beside a curtained metal disinfection chamber with a wall-mounted control box, next to a green panel titled Disinfection Chamber for covid 19.",
        "caption": "Our team !"
      }
    ]
  },
  {
    "year": "2020",
    "title": "Early Flood Detection",
    "role": "Team member · ESP32",
    "summary": "Alerts people on floodplains before water levels turn dangerous, using ultrasonic and float sensors with a phone app.",
    "photos": [
      {
        "file": "21-early-flood-detection-system.jpg",
        "alt": "A bench rig against an orange backdrop: a clear acrylic box of electronics with a red alarm beacon on top, wired to an open water tank walled with foam.",
        "caption": "Early Flood Detection & Avoidance System prototype"
      }
    ]
  },
  {
    "year": "2020",
    "title": "Singapore Space Rover Challenge",
    "role": "Perception Engineer",
    "summary": "Perception and localization for a rover, relaying its position from onboard sensors.",
    "photos": [
      {
        "file": "13-singapore-space-challenge.jpg",
        "alt": "A promotional poster showing a six-wheeled rover on grey terrain against a starfield, with a 30 October 2020 registration deadline and a ten thousand dollar grand prize.",
        "caption": "Singapore Space Rover Challenge, 2020 — competition poster"
      }
    ]
  },
  {
    "year": "2021",
    "title": "Slamware Indoor Mobile Robot",
    "role": "Robotics Developer · ROM Robotics",
    "summary": "SLAM and navigation for a commercial indoor robot used for catering and office delivery.",
    "photos": [
      {
        "file": "24-slamware-based-robot.jpg",
        "alt": "The yellow tiered robot with its black lidar sensor sits in front of a television running mapping software that displays a red and white floor plan of a room.",
        "caption": "Slamware based Robot"
      },
      {
        "file": "14-mobile-robot-using-slamtec-technology.jpg",
        "alt": "A robot built from stacked yellow acrylic plates on threaded rods, carrying a black spinning lidar puck, with a laptop and television showing C++ code behind it.",
        "caption": "Mobile Robot using Slamtec technology"
      }
    ]
  }
];
