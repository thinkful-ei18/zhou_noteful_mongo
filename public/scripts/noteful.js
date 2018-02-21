/* global $ store api moment */
'use strict';

const noteful = (function () {

  function render() {
    const notesList = generateNotesList(store.notes, store.currentNote);
    $('.js-notes-list').html(notesList);

    const folderList = generateFolderList(store.folders, store.currentQuery);
    $('.js-folders-list').html(folderList);

    const folderSelect = generateFolderSelect(store.folders);
    $('.js-note-folder-entry').html(folderSelect);

    const tagsList = generateTagsList(store.tags, store.currentQuery);
    $('.js-tags-list').html(tagsList);

    const tagsSelect = generateTagsSelect(store.tags);
    $('.js-note-tags-entry').html(tagsSelect);

    const editForm = $('.js-note-edit-form');
    editForm.find('.js-note-title-entry').val(store.currentNote.title);
    editForm.find('.js-note-content-entry').val(store.currentNote.content);
    editForm.find('.js-note-folder-entry').val(store.currentNote.folderId);

    editForm.find('.js-note-tags-entry').val(() => {
      if (store.currentNote.tags) {
        return store.currentNote.tags.map(tag => tag.id);
      }
    });
  }

  /**
   * GENERATE HTML FUNCTIONS
   */
  function generateNotesList(list, currNote) {
    const listItems = list.map(item => `
      <li data-id="${item.id}" class="js-note-element ${currNote.id === item.id ? 'active' : ''}">
        <a href="#" class="name js-note-link">${item.title}</a>
        <button class="removeBtn js-note-delete-button">X</button>
        <div class="metadata">
            <div class="date">${moment(item.created).calendar()}</div>
            <div class="tags">${getTagsCommaSeparated(item.tags)}</div>
          </div>
      </li>`);
    return listItems.join('');
  }

  function generateFolderList(list, currQuery) {
    const showAllItem = `
      <li data-id="" class="js-folder-item ${!currQuery.folderId ? 'active' : ''}">
        <a href="#" class="name js-folder-link">All</a>
      </li>`;

    const listItems = list.map(item => `
      <li data-id="${item.id}" class="js-folder-item ${currQuery.folderId === item.id ? 'active' : ''}">
        <a href="#" class="name js-folder-link">${item.name}</a>
        <button class="removeBtn js-folder-delete">X</button>
      </li>`);

    return [showAllItem, ...listItems].join('');
  }

  function generateFolderSelect(list) {
    const notes = list.map(item => `<option value="${item.id}">${item.name}</option>`);
    return '<option value="">Select Folder:</option>' + notes.join('');
  }

  function generateTagsList(list, currQuery) {
    const showAllItem = `
      <li data-id="" class="js-tag-item ${!currQuery.tagId ? 'active' : ''}">
        <a href="#" class="name js-tag-link">All</a>
      </li>`;

    const listItems = list.map(item => `
      <li data-id="${item.id}" class="js-tag-item ${currQuery.tagId === item.id ? 'active' : ''}">
        <a href="#" class="name js-tag-link">${item.name}</a>
        <button class="removeBtn js-tag-delete">X</button>
      </li>`);
    return [showAllItem, ...listItems].join('');
  }

  function generateTagsSelect(list) {
    const notes = list.map(item => `<option value="${item.id}">${item.name}</option>`);
    return notes.join('');
  }

  /**
   * HELPERS
   */
  function getNoteIdFromElement(item) {
    console.log(item)
    const id = $(item).closest('.js-note-element').data('id');
    console.log(id)
    return id;
  }

  function getFolderIdFromElement(item) {
    const id = $(item).closest('.js-folder-item').data('id');
    return id;
  }

  function getTagIdFromElement(item) {
    const id = $(item).closest('.js-tag-item').data('id');
    return id;
  }

  function getTagsCommaSeparated(tags) {
    return tags ? tags.map(tag => tag.name).join(', ') : '';
  }

  /**
   * NOTES EVENT LISTENERS AND HANDLERS
   */
  function handleNoteItemClick() {
    $('.js-notes-list').on('click', '.js-note-link', event => {
      event.preventDefault();

      const noteId = getNoteIdFromElement(event.currentTarget);

      api.details(`/v3/notes/${noteId}`)
        .then((response) => {
          store.currentNote = response;
          render();
        });
    });
  }

  function handleNoteSearchSubmit() {
    $('.js-notes-search-form').on('submit', event => {
      event.preventDefault();

      store.currentQuery.searchTerm = $(event.currentTarget).find('input').val();

      api.search('/v3/notes', store.currentQuery)
        .then(response => {
          store.notes = response;
          render();
        });
    });
  }


  function handleNoteFormSubmit() {
    $('.js-note-edit-form').on('submit', function (event) {
      event.preventDefault();

      const editForm = $(event.currentTarget);
      const noteObj = {
        id: store.currentNote.id,
        title: editForm.find('.js-note-title-entry').val(),
        content: editForm.find('.js-note-content-entry').val(),
        folderId: editForm.find('.js-note-folder-entry').val(),
        tags: editForm.find('.js-note-tags-entry').val()
      };

      if (store.currentNote.id) {
        api.update(`/v3/notes/${noteObj.id}`, noteObj)
          .then(updateResponse => {
            store.currentNote = updateResponse;
            return api.search('/v3/notes', store.currentQuery);
          })
          .then(response => {
            store.notes = response;
            render();
          });
      } else {
        api.create('/v3/notes', noteObj)
          .then(createResponse => {
            store.currentNote = createResponse;
            return api.search('/v3/notes', store.currentQuery);
          })
          .then(response => {
            store.notes = response;
            render();
          });
      }
    });
  }

  function handleNoteStartNewSubmit() {
    $('.js-start-new-note-form').on('submit', event => {
      event.preventDefault();
      store.currentNote = {};
      render();
    });
  }

  function handleNoteDeleteClick() {
    $('.js-notes-list').on('click', '.js-note-delete-button', event => {
      event.preventDefault();
      const noteId = getNoteIdFromElement(event.currentTarget);

      api.remove(`/v3/notes/${noteId}`)
        .then(() => {
          if (noteId === store.currentNote.id) {
            store.currentNote = {};
          }
          return api.search('/v3/notes', store.currentQuery);
        })
        .then(response => {
          store.notes = response;
          render();
        });
    });
  }

  /**
   * FOLDERS EVENT LISTENERS AND HANDLERS
   */
  function handleFolderClick() {
    $('.js-folders-list').on('click', '.js-folder-link', event => {
      event.preventDefault();

      const folderId = getFolderIdFromElement(event.currentTarget);
      store.currentQuery.folderId = folderId;
      if (folderId !== store.currentNote.folderId) {
        store.currentNote = {};
      }

      api.search('/v3/notes', store.currentQuery)
        .then(response => {
          store.notes = response;
          render();
        });
    });
  }

  function handleNewFolderSubmit() {
    $('.js-new-folder-form').on('submit', event => {
      
      const newFolderName = $('.js-new-folder-entry').val();
      api.create('/v3/folders', { name: newFolderName })
        .then(() => {
          $('.js-new-folder-entry').val();
          return api.search('/v3/folders');
        }).then(response => {
          store.folders = response;
          render();
        }).catch(err => {
          $('.js-error-message').text(err.responseJSON.message);
        });
    });
  }

  function handleFolderDeleteClick() {
    $('.js-folders-list').on('click', '.js-folder-delete', event => {
      event.preventDefault();
      const folderId = getFolderIdFromElement(event.currentTarget);

      if (folderId === store.currentQuery.folderId) {
        store.currentQuery.folderId = null;
      }
      if (folderId === store.currentNote.folderId) {
        store.currentNote = {};
      }

      api.remove(`/v3/folders/${folderId}`)
        .then(() => {
          const notesPromise = api.search('/v3/notes');
          const folderPromise = api.search('/v3/folders');
          return Promise.all([notesPromise, folderPromise]);
        })
        .then( ([notes, folders])  => {
          store.notes = notes;
          store.folders = folders;
          render();
        });
    });
  }

  /**
   * TAGS EVENT LISTENERS AND HANDLERS
   */
  function handleTagClick() {
    $('.js-tags-list').on('click', '.js-tag-link', event => {
      event.preventDefault();

      const tagId = getTagIdFromElement(event.currentTarget);
      store.currentQuery.tagId = tagId;

      //TODO; loop over tags, if not a match, then clear
      store.currentNote = {};

      api.search('/v3/notes', store.currentQuery)
        .then(response => {
          store.notes = response;
          render();
        });
    });
  }

  function handleNewTagSubmit() {
    $('.js-new-tag-form').on('submit', event => {
      // event.preventDefault();
      const newTagName = $('.js-new-tag-entry').val();
      api.create('/v3/tags', { name: newTagName })
        .then(() => api.search('/v3/tags'))
        .then(response => {
          store.tags = response;
          render();
        })
        .catch(err => {
          console.error(err);
        });
    });
  }

  function handleTagDeleteClick() {
    $('.js-tags-list').on('click', '.js-tag-delete', event => {
      event.preventDefault();
      const tagId = getTagIdFromElement(event.currentTarget);

      if (tagId === store.currentQuery.tagId) {
        store.currentQuery.tagId = null;
      }

      //TODO; loop over tags, if not a match, then clear
      store.currentNote = {};

      api.remove(`/v3/tags/${tagId}`)
        .then(() => {
          return api.search('/v3/tags');
        })
        .then(response => {
          store.tags = response;
          return api.search('/v3/notes', store.currentQuery);
        })
        .then(response => {
          store.notes = response;
          render();
        });
    });
  }
  
  function bindEventListeners() {
    handleNoteItemClick();
    handleNoteSearchSubmit();

    handleNoteFormSubmit();
    handleNoteStartNewSubmit();
    handleNoteDeleteClick();

    handleFolderClick();
    handleNewFolderSubmit();
    handleFolderDeleteClick();
    handleTagClick();
    handleNewTagSubmit();
    handleTagDeleteClick();
  }

  // This object contains the only exposed methods from this module:
  return {
    render: render,
    bindEventListeners: bindEventListeners,
  };

}());
