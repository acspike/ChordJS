/**
 * This add-on adds some knowledge about common chords.
 *
 * NOTE: There must be more mathematical way to represent some of this stuff.
 * NOTE: IANAM (I am not a musician!)
 */
chords.common= {
  //tuning
  'standard' : {
  //type
   'major' : {
	'A'    : [['X02220','--123-']],
	'A#/Bb': [['X13331','-13331']],
	'B'    : [['X24442','-13331']],
	'C'    : [['X32010','-32-1-']],
	'C#/Db': [['X46664','-13331']],
	'D'    : [['XX0232','---132']],
	'D#/Eb': [['XX1343','--1243']],
	'E'    : [['022100','-231--']],
	'F'    : [['133211','134211']],
	'F#/Gb': [['244322','134211']],
	'G'    : [['320003','21---3']],
	'G#/Ab': [['466544','134211']]
   },
   'minor' : {
	'A'    : [['X02210','--231-']],
	'A#/Bb': [['X13321','-13421']],
	'B'    : [['X24432','-13421']],
	'C'    : [['X35543','-13421']],
	'C#/Db': [['X46654','-13421']],
	'D'    : [['XX0231','---132']],
	'D#/Eb': [['XX4342','--3241']],
	'E'    : [['022000','-23---']],
	'F'    : [['133111','134111']],
	'F#/Gb': [['244222','134111']],
	'G'    : [['355333','134111']],
	'G#/Ab': [['466444','134111']]
   },
   'seven' : {
	'A'    : [['X02020','--1-3-']],
	'A#/Bb': [['X13131','-12131']],
	'B'    : [['X24242','-12131']],
	'C'    : [['X32310','-32-1-']],
	'C#/Db': [['X46464','-12131']],
	'D'    : [['XX0212','---213']],
	'D#/Eb': [['XX1313','--1213']],
	'E'    : [['020100','-2-1--']],
	'F'    : [['131211','131211']],
	'F#/Gb': [['242322','131211']],
	'G'    : [['320001','32---1']],
	'G#/Ab': [['464544','131211']]
   }
  }
};
//TODO: VII chord should be a 'dim'
chords.common.keys= {
    'major' : {
	'A'    : [['A'],['B','minor'],['C#/Db','minor'],['D'],['E'],['F#/Gb','minor'],['G']],
	'B'    : [['B'],['C#/Db','minor'],['D#/Eb','minor'],['E'],['F#/Gb'],['G#/Ab','minor'],['A#/Bb']],
	'C'    : [['C'],['D','minor'],['E','minor'],['F'],['G'],['A','minor'],['A#/Bb']],
	'D'    : [['D'],['E','minor'],['F#/Gb','minor'],['G'],['A'],['B','minor'],['C']],
	'E'    : [['E'],['F#/Gb','minor'],['G#/Ab','minor'],['A'],['B'],['C#/Db','minor'],['D']],
	'F'    : [['F'],['G','minor'],['A','minor'],['A#/Bb'],['C'],['D','minor'],['E']],
	'G'    : [['G'],['A','minor'],['B','minor'],['C'],['D'],['E','minor'],['F']],
    }
};
chords.common.types= {
    'abbreviations' : {
	'major' : '',
	'minor' : 'm',
	'seven' : '7'
   }
};
chords.common.makeChord= function(container,note,size,typ,name,tuning) {
	if(typ == undefined) { typ='major'; }
	if(size == undefined) { size=3; }
	if(tuning == undefined) { tuning = 'standard'; }
	if(name == undefined) { name = note + chords.common.types.abbreviations[typ]; }
	container.append('<chord name="'+name+'" positions="'+chords.common[tuning][typ][note][0][0]+'" fingers="'+chords.common[tuning][typ][note][0][1]+'" size="'+size+'" ></chord>');
};

