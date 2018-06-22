RESTful Routes
===============maint================================
INDEX       /campgrounds                    GET
NEW         /campgrounds/new                GET
CREATE      /campgrounds                    POST
SHOW        /campgrounds/:id                GET
EDIT        /campgrounds/:id/edit           GET
UPDATE      /campgrounds/:id                PUT
DESTROY     /campgrounds/:id                DELETE

==============comments==============================
NEW         /campgrounds/:id/comments/new               GET
CREATE      /campgrounds/:id/comments                   POST
EDIT        /campgrounds/:id/comments/:comment_id/edit  GET
UPDATE      /campgrounds/:id/comments/:comment_id       PUT
DESTROY     /campgrounds/:id/comments/:comment_id       DELETE