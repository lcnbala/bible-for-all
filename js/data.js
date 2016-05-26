var books = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonian','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation']
var chapters = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
var current_version = '3.4';

function add_remove(version, action) {
	if (action == 0) {
		var viewTabUrl = chrome.extension.getURL('bible.html');
		var views = chrome.extension.getViews();

		for (var i = 0; i < views.length; i++) {
			var view = views[i];
			if (view.location.href == viewTabUrl) {
				view._database.transaction(function(query) { query.executeSql("DROP TABLE " + version) }); 
				document.getElementById(version).innerHTML = 'not installed';
				break;
			}
		}
	}	
}		

function add_books() {
	for (var i = 0; i < books.length; i++)
		$('#bible_books').append('<option value="book_' + i + '">' + books[i] + "</option>");
}

function add_chapters() {
	for (var i = 1; i <= 50; i++)
		$('#bible_chapters').append('<option value="chapter_' + i + '">' + i + "</option>");
}

function getBibleView() {
	var viewTabUrl = chrome.extension.getURL('bible.html');
	var views = chrome.extension.getViews();

	for (var i = 0; i < views.length; i++) {
		var view = views[i];
		if (view.location.href == viewTabUrl) 
			return view;			
	}
}

function afterInitialization() {
    add_books();
    add_chapters();

    localStorage['version'] = current_version;
    localStorage['bible_version'] = 'en_kjv';

    loadBibleChapter('Genesis', 1);
    $('#book_0').addClass('selected');
    $('#chapter_1').addClass('selected');

    $('#loading').hide();
    $('#table_main').show();
}

function onSuccess(tx, r) {
    afterInitialization();
	$("#bible").val($("#bible option:first").val());
}

function initialize() {
	var view = getBibleView();		
	view._database = window.openDatabase('bible_for_all_3', "", 'bible_for_all_3', 9999999999);
	if (current_version != localStorage['version']) {
		view._database.transaction(function(query) { 
			query.executeSql('DROP table en_kjv', []); 
		}); 	
		view._database.transaction(function(query) { 
			query.executeSql('DROP table en_nasb', []);
		}); 	

		get_en_nasb();
		get_en_kjv();

	} else {
        afterInitialization();
    }
}

function loadBibleChapter(book, chapter) {
	var view = getBibleView();
	if (book != undefined && chapter != undefined) {
		if (view._database) {
			view._database.transaction(function(query) { 				
				query.executeSql("SELECT * FROM " + localStorage['bible_version'] + " WHERE carte = ? AND capitol = ?", [book, parseInt(chapter)], 			
					function(transaction, result) { 
						var total = result.rows.length;
                        $('#content').html('<tr><td><h2>' + book + ' ' + chapter + '</h2>');
                        var verse = '';
						for (var i = 0; i < total; i++) {			
							verse += '<div class="verse"><b>' + ' ' + (i + 1) + '</b> ' + result.rows.item(i).text + '<br />' + '</div>';
						}   
                        $('#content').append(verse + '</td></tr>');
					}
				)
			}); 
		}
	}
}

$(document).ready(function() {

    initialize();

    $(document).on('change', "#bible_books", function (event) {

        var bookIndex = $(this).find(":selected").val().replace('book_', '');
        var chaptersTotal = chapters[bookIndex];

        var opt = '';
        for (var i = 0; i < chaptersTotal; i++) {
            opt += '<option value="chapter_' + (i + 1) + '">' + (i + 1) + '</option>';
        }

        $('#bible_chapters').html(opt);

        $('#main_bible_content').html('<div id="bible_content"><table width="100%" id="content"></table></div>');

        loadBibleChapter(books[bookIndex], 1);
    });

    $(document).on('change', "#bible_chapters", function (event) {
        var chapterIndex = $(this).find(":selected").val().replace('chapter_', '');
        var bookIndex = $('#bible_books').find(":selected").val().replace('book_', '');
		loadBibleChapter(books[bookIndex], parseInt(chapterIndex));
    });

    $("#read").on('click', function(event) {
        var value = $('#read').val();
        if (value == 'Read chapter') {
			var chapterIndex = $('#bible_chapters').find(":selected").val().replace('chapter_', '') + '.0';
			var bookIndex = $('#bible_books').find(":selected").text();
			var view = getBibleView();

			if (bookIndex != undefined && chapterIndex != undefined) {
				if (view._database) {
					view._database.transaction(function(query) {
						query.executeSql("SELECT * FROM " + localStorage['bible_version'] + " WHERE carte = ? AND capitol = ?", [bookIndex, chapterIndex],

							function(transaction, result) {
								var total = result.rows.length;
								for (var i = 0; i < total; i++) {
									console.log(result.rows.item(i).text);
									chrome.tts.speak(result.rows.item(i).text, {
										lang: 'en-US',
										enqueue: true,
										gender: 'female',
										rate: 0.9
									});
								}
							}
						)
					});
				}
			}

            $('#read').val('Stop Reading');
            
        } else {
            chrome.tts.stop();
            $('#read').val('Read chapter');
        }
    });

	function search_bible(input) {
		var words = input.match(/("[^"]+"|[^"\s]+)/g);
		
		for (var i = 0; i < words.length; i++) {
			words[i] = words[i].replace(/"/gi, '');
			words[i] = words[i].replace(/'/gi, '');
		}			
		
		document.getElementById('content').innerHTML = '';
		
		var view = getBibleView();
		view._database.transaction(function(query) { 
			var queryString = 'SELECT * FROM ' + localStorage['bible_version'] + ' WHERE ';
			for (var i = 0; i < words.length; i++) {
				words[i] = words[i].replace(/"/gi, '');
				queryString += ' text LIKE "%' + words[i] + '%" AND '
			}

			queryString = queryString.substr(0, queryString.length - 4);
						
			query.executeSql(queryString, [], 			
				function(transaction, result) { 
					var total = result.rows.length;
					document.getElementById('content').innerHTML = '<div>Search results ' + total + "</div>";
					document.getElementById('content').innerHTML += '<br />'
					for (var i = 0; i < total; i++) {			
						var opt = document.createElement("div");
						opt.className = 'verse';
						opt.innerHTML = '<b>' + result.rows.item(i).carte + ' ' +  parseInt(result.rows.item(i).capitol) + ':' + parseInt(result.rows.item(i).verset) + "</b>" + ' ' + ' '  + result.rows.item(i).text;
						document.getElementById('content').appendChild(opt);
					}
					for (var i = 0; i < words.length; i++)
						$('#content').highlight(words[i]);
				}		
			)
		});         	
	}
	
	$("#search_text").keypress(function(e) {
        if(e.keyCode == 13) {
        var q = $('#search_text').val();
		if (q.length > 3) 
			search_bible(q);
        }
    });

	$(document).on('change', "#bible", function (event) {
		localStorage['bible_version'] = $('#bible').find(":selected").val();
		$('#content').children().remove();
		
		var bookIndex = $('#bible_books').find(":selected").val().replace('book_', '');
        var chapterIndex = $('#bible_chapters').find(":selected").val().replace('chapter_', '');

		loadBibleChapter(books[bookIndex], chapterIndex);
	});	
	
	$('#bible').val(localStorage['bible_version']);

	var $window = $(window),
	$stickyEl = $('#the-sticky-div'),
	elTop = $stickyEl.offset().top;

	$window.scroll(function() {
		$stickyEl.toggleClass('sticky', $window.scrollTop() > elTop);
	});
});